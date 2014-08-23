/*global define, require*/
/*jslint node:true, vars:true,nomen:true*/
define([
    'node-promise',
    'appConfig',
    'databaseConfig',
    'util/modelEndpointHandler',
    'util/dbconnectionHandler',
    'log'
], function (promise, appConfig, databaseConfig, meHandler, dbHandler, log) {
    'use strict';
    var Promise = promise.Promise;

    function save(document) {
        var savePromise = new Promise();

        document.save(function (err) {
            if (err) {
                savePromise.reject(err);
            } else {
                savePromise.resolve();
            }
        });

        return savePromise;
    }

    function addClientToSystem(database) {
        var createClient = new Promise();

        dbHandler.get(databaseConfig.systemdb, function (db) {
            meHandler.load().then(function () {
                meHandler.init(db, function (models) {
                    meHandler.clearModels([models.Client]).then(function () {
                        var Client = models.Client,
                            client = new Client({
                                alias: database,
                                name: database,
                                active: true
                            });

                        client.save(function (err, clients) {
                            if (err) {
                                createClient.reject(err);
                            } else {
                                createClient.resolve(clients);
                            }
                        });
                    }, createClient.reject);
                });
            }, createClient.reject);
        });

        return createClient;
    }

    return function (database) {
        var reinstalltask = new Promise();
        database = database || appConfig.defaultClient;

        addClientToSystem(database).then(function () {
            dbHandler.get(database, function (db) {
                meHandler.load().then(function () {
                    meHandler.init(db, function (models) {
                        meHandler.clearModels(models).then(function () {
                            var User = models.User,
                                user = new User({
                                    username: 'test',
                                    email: 'test@test.com',
                                    password: '1234',
                                    permissions: [appConfig.permissions.user]
                                }),
                                admin = new User({
                                    username: appConfig.permissions.admin,
                                    email: 'admin@test.com',
                                    password: '1234',
                                    permissions: [appConfig.permissions.admin]
                                });

                            var tasks = [];

                            tasks.push(save(user)); // create customer
                            tasks.push(save(admin)); // create admin
                            tasks.push();

                            promise.allOrNone(tasks).then(function () {
                                log.info('# FINISH!');
                                reinstalltask.resolve();
                            }, reinstalltask.reject);
                        }, reinstalltask.reject);
                    });
                }, reinstalltask.reject);
            });
        }, reinstalltask.reject);


        return reinstalltask;
    };
});
