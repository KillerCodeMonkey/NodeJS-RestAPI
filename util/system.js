/*global define*/
/*jslint vars:true,nomen:true*/
define([
    'node-promise',
    'appConfig',
    'databaseConfig',
    'fs',
    'util/modelEndpointHandler',
    'util/dbconnectionHandler',
    'log'
], function (promise, appConfig, databaseConfig, fs, meHandler, dbHandler, log) {
    'use strict';

    var Promise = promise.Promise;

    var System = function () {

        this.deleteDBFilesRecursive = function (path, fileName) {
            var self = this;
            if (!path || !fileName) {
                return;
            }

            if (fs.existsSync(path)) {
                fs.readdirSync(path).forEach(function (file) {
                    var regexp = new RegExp('^' + fileName);
                    if (regexp.test(file)) {
                        var curPath = path + "/" + file;
                        if (fs.lstatSync(curPath).isDirectory()) { // recurse
                            self.deleteDBFilesRecursive(curPath);
                        } else { // delete file
                            fs.unlinkSync(curPath);
                        }
                    }
                });
            }
        };

        this.deleteStaticFilesRecursive = function (path) {
            var self = this;
            if (!path) {
                return;
            }

            if (fs.existsSync(path)) {
                fs.readdirSync(path).forEach(function (file) {
                    var curPath = path + "/" + file;
                    if (fs.lstatSync(curPath).isDirectory()) { // recurse
                        self.deleteStaticFilesRecursive(curPath);
                    } else { // delete file
                        fs.unlinkSync(curPath);
                    }
                });
                fs.rmdirSync(path);
            }
        };

        this.createSystem = function (username, password) {
            var createtask = new Promise();

            dbHandler.get(databaseConfig.systemdb, function (db) {
                db.db.dropDatabase();
                meHandler.load().then(function () {
                    meHandler.init(db, function (models) {
                        var User = models.User,
                            systemUser = new User({
                                username: username,
                                password: password,
                                email: 'sysadmin@test.com',
                                permissions: [appConfig.permissions.sysadmin]
                            });

                        systemUser.save(function (err) {
                            if (err) {
                                createtask.reject(err);
                            } else {
                                createtask.resolve();
                                log.info('Finish: #System user created');
                            }
                        });
                    });
                }, createtask.reject);
            });

            return createtask;
        };
    };

    return new System();
});