/*global define*/
/*jslint vars:true*/
define([
    'util/dbconnectionHandler',
    'log',
    'databaseConfig',
    'util/modelEndpointHandler'
], function (dbconnectionHandler, log, databaseConfig, meHandler) {
    'use strict';
    return function (req, res, next, db) {
        var isSystemDB = db === databaseConfig.systemdb;

        if (db) {
            // load sysdb
            dbconnectionHandler.get(databaseConfig.systemdb, function (sysdb) {
                // if client database
                if (!isSystemDB) {
                    meHandler.init(sysdb, function (models) {
                        // check if client database exists, is active
                        models.Client.findOne({
                            alias: db
                        }, function (err, client) {
                            if (err) {
                                return res.send(500, {
                                    error: err
                                });
                            }
                            if (!client) {
                                return res.send(404, {
                                    error: 'database_not_exists'
                                });
                            }
                            if (!client.active) {
                                return res.send(404, {
                                    error: 'database_not_activated'
                                });
                            }
                            // get client db object
                            dbconnectionHandler.get(client.alias, function (clientDatabase) {
                                // log.info('Using database ' + req.db.name);
                                req.client = client;
                                req.db = clientDatabase;
                                next();
                            }, client);
                        });
                    });
                } else {
                    req.db = sysdb;
                    // log.info('Using database ' + req.db.name);
                    next();
                }
            });
        } else {
            next();
        }
    };
});
