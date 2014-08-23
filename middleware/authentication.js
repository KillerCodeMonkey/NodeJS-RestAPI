define([
    'jsonwebtoken',
    'appConfig',
    'databaseConfig',
    'util/modelEndpointHandler',
    'middleware/dbconnection',
    'underscore'
], function (jwt, appConfig, databaseConfig, modelEndpointHandler, dbconnection, _) {
    'use strict';

    return function (req, res, next) {
        var token,
            parts,
            scheme,
            capseledRequest = {},
            credentials;

        // extract bearer token if it is set in headers authorization
        if (!req.headers || !req.headers.authorization) {
            return next();
        }
        parts = req.headers.authorization.split(' ');
        if (parts.length !== 2) {
            return next();
        }
        scheme = parts[0];
        credentials = parts[1];

        if (/^Bearer$/i.test(scheme)) {
            token = credentials;
        }

        // if verify fails with -> invalid token
        try {
            // verify token
            jwt.verify(token, appConfig.secret, function (err, decoded) {
                if (err) {
                    if (err.message === 'jwt expired') {
                        return res.send(401);
                    }
                    return next();
                }

                // try to access other db with sysuser.
                if (decoded && decoded.permissions && decoded.permissions.indexOf(appConfig.permissions.sysadmin) > -1 && req.db.name !== databaseConfig.systemdb) {
                    // special grant für system admin
                    _.extend(capseledRequest, req);
                    dbconnection(capseledRequest, res, function () {
                        modelEndpointHandler.initDb(capseledRequest, res, ['authentication'], function (newReq, res, Authentication) {
                            Authentication.findOne({
                                accessToken: token
                            }, function (error, authentication) {
                                dbconnection(req, res, function () {
                                    if (error || !authentication) {
                                        return next();
                                    }
                                    // everything works sysadmin is logged in -> put decoded user on req.
                                    req.user = decoded;
                                    req.user.accessToken = token;
                                    return next();
                                }, req.db.name);
                            });
                        });
                    }, databaseConfig.systemdb);
                } else {
                    modelEndpointHandler.initDb(req, res, ['authentication'], function (req, res, Authentication) {
                        Authentication.findOne({
                            accessToken: token
                        }, function (error, authentication) {
                            if (!authentication || error) {
                                return next();
                            }
                            // everything works -> put decoded user on req.
                            req.user = decoded;
                            req.user.accessToken = token;
                            return next();
                        });
                    });
                }
            });
        } catch (e) {
            res.send(400, {
                error: 'invalid_access_token'
            });
        }
    };
});