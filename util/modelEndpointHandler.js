define([
    'node-promise',
    'fs',
    'log',
    'databaseConfig'
], function (promise, fs, log, databaseConfig) {
    'use strict';

    var Promise = promise.Promise,
        endpoints = {},
        models = {};

    // require model and enpoint
    function requireFile(file, endpoints, models) {
        var filePromise = new Promise(),
            nameWithoutExtension = file.substr(0, file.lastIndexOf('.'));

        // log.info('#LOAD model: ' + nameWithoutExtension);

        require(['models/' + nameWithoutExtension], function (model) {
            models[nameWithoutExtension] = model;
            if (fs.existsSync('endpoints/' + file)) {
                // log.info('#LOAD endpoint: ' + nameWithoutExtension);
                require(['endpoints/' + nameWithoutExtension], function (endpoint) {
                    endpoints[nameWithoutExtension] = endpoint;
                    filePromise.resolve();
                });
            } else {
                filePromise.resolve();
            }
        });

        return filePromise;
    }

    function clearModel(model) {
        var prom = new Promise();

        model.collection.dropAllIndexes(function () {
            // log.info(model.modelName + ': try dropAllIndexes');
            model.remove(function (err) {
                if (err) {
                    prom.reject(err);
                } else {
                    // log.info(model.modelName + ': try drop');
                    prom.resolve();
                }
            });
        });

        return prom;
    }

    function clearModels(models) {
        var tasks = [],
            key,
            model;

        for (key in models) {
            if (models.hasOwnProperty(key)) {
                model = models[key];
                tasks.push(clearModel(model));
            }
        }

        return tasks;
    }

    // load all models (in src/models) and the associated endpoint
    return {
        load: function () {
            var loader = new Promise(),
                tasks = [];

            fs.readdir('models', function (err, files) {
                var i = 0;
                if (err) {
                    log.error('error during reading models');
                    loader.reject();
                }
                for (i; i < files.length; i = i + 1) {
                    tasks.push(requireFile(files[i], endpoints, models));
                }
                promise.allOrNone(tasks).then(function () {
                    loader.resolve([models, endpoints]);
                }, loader.reject);
            });

            return loader;
        },

        initDb: function (req, res, requiredModels, callback) {
            var i = 0,
                db = req.db,
                initModels = [];

            if (db && requiredModels) {
                for (i; i <= requiredModels.length; i = i + 1) {
                    if (models[requiredModels[i]] && models[requiredModels[i]].schema) {
                        if ((models[requiredModels[i]].systemdb && db.name !== databaseConfig.systemdb) || (models[requiredModels[i]].systemdb !== undefined && !models[requiredModels[i]].systemdb && req.db.name === databaseConfig.systemdb)) {
                            return res.send(403);
                        }
                        initModels.push(db.model(requiredModels[i], models[requiredModels[i]].schema));
                    }
                }
            }
            initModels.unshift(res);
            initModels.unshift(req);

            callback.apply(undefined, initModels);
        },

        // init models for db without request (static loader)
        init: function (db, callback) {
            var i,
                initModels = {};
            if (db) {
                for (i in models) {
                    if (models.hasOwnProperty(i) && models[i].schema) {
                        // check if mode only for sysdb && db === sysdb || no sysdb restrictions || model not for sysdb and db !== sysdb
                        if ((models[i].systemdb && db.name === databaseConfig.systemdb) || (models[i].systemdb === undefined) || (!models[i].systemdb && db.name !== databaseConfig.systemdb)) {
                            initModels[models[i].model.modelName] = db.model(models[i].model.modelName, models[i].schema);
                        }
                    }
                }
            }

            callback(initModels);
        },

        clearModels: function (models) {
            var newPromise = new Promise();

            promise.all(clearModels(models)).then(newPromise.resolve, newPromise.reject);

            return newPromise;
        }
    };
});