/*global define*/
/*jslint vars:true*/
define([
    'util/cacheHandler',
    'mongoose',
    'databaseConfig',
    'log'
], function (Cache, mongoose, databaseConfig, log) {
    'use strict';

    var dbconcache = function () {
        return new Cache(
            function resolve(dbname, callback, client) {
                var host, user, password, port,
                    DB = client && client.active ? client : {};

                // allow db to be on a different system
                host = DB.host || databaseConfig.host;
                port = DB.port || databaseConfig.port;
                user = DB.user || databaseConfig.username;
                password = DB.password || databaseConfig.password;

                var opt = {
                    user: user,
                    pass: password,
                    auth: {
                        authdb: databaseConfig.authdb
                    }
                };

                var connection = mongoose.createConnection(host, dbname.toString(), port, opt);

                connection.on('open', function () {
                    callback(connection);
                });

                connection.on('error', function (err) {
                    log.error(err);
                });
            },
            function dispose(db) {
                db.close();
            }
        );
    };

    return dbconcache();
});