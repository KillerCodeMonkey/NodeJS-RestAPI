/** @file authentication.js Endpoints for authentication request
 *  @module Authentication
 * */
define([
    'jsonwebtoken',
    'crypto',
    'appConfig',
    'node-promise'
], /** @lends Authentication */ function (jwt, crypto, appConfig, promise) {
    'use strict';

    var Promise = promise.Promise,
        rest = {};

    // store new authentication for user
    function generateAuthentication(user, Authentication, dbName) {
        var $q = new Promise(),
            secret = crypto.randomBytes(128).toString('base64'),
            userData = {
                id: user.userId || user.id,
                username: user.username,
                email: user.email,
                created: user.created,
                permissions: user.permissions,
                secret: secret,
                expiresInMinutes: appConfig.tokenExpiresInMinutes,
                tokenType: 'Bearer',
                db: dbName
            },
            accessToken,
            refreshToken,
            auth;

        accessToken = jwt.sign(userData, appConfig.secret, { expiresInMinutes: appConfig.tokenExpiresInMinutes });
        userData.accessToken = accessToken;

        refreshToken = jwt.sign(userData, appConfig.secret);
        userData.refreshToken = refreshToken;

        auth = new Authentication({
            userId: userData.id,
            secret: secret,
            accessToken: accessToken,
            refreshToken: refreshToken
        });

        auth.save(function (err) {
            if (err) {
                $q.reject(err);
            } else {
                $q.resolve(userData);
            }
        });

        return $q;
    }

    /**
     * @function login
     * @description Login for sysadmin and client staff
     * @property /api/[version]/[database]/authentication/login url
     * @property {POST} Method - request method
     * @param {string} password - User password
     * @param {string} login - Username or Email address
     * @return {string} id - user id
     * @return {string} username - username
     * @return {date} created - user creation date
     * @return {string[]} permissions - user permissions
     * @return {integer} expiresInMinutes - when access expires
     * @return {string} tokenType - access token type
     * @return {string} accessToken - token to authorize as logged in user
     * @return {string} refreshToken - token to generate access/refresh token if old access token expires
     * @throws 400 'missing_login_or_password' - if login or password is missing
     * @throws 400 'missing_login_or_password' - if login or password is missing
     * @throws 400 'already_logged_in' - if you send valid authorization header you are already logged in
     * @throws 400 'user_not_exists' - user does not exist in database
     * @throws 400 'invalid_login_password_combination' - login/password combination is invalid
     */
    rest.login = {
        permissions: [],
        models: ['user', 'authentication'],
        exec: function (req, res, User, Authentication) {
            if (req.user) {
                return res.send(400, {
                    error: 'already_logged_in'
                });
            }
            if (!req.body.login || !req.body.password) {
                return res.send(400, {
                    error: 'missing_login_or_password'
                });
            }
            User.findOne({
                $or: [{
                    email: req.body.login
                }, {
                    username: req.body.login
                }]
            }, function (err, user) {
                if (err) {
                    return res.send(500, err);
                }
                if (!user) {
                    return res.send(400, {
                        error: 'user_not_exists'
                    });
                }
                if (!user.checkPassword(req.body.password)) {
                    return res.send(400, {
                        error: 'invalid_login_password_combination'
                    });
                }

                generateAuthentication(user, Authentication, req.db.name).then(function (userData) {
                    res.send(userData);
                }, function (err) {
                    res.send(400, err);
                });
            });
        }
    };

    /**
     * @function refresh
     * @description Refreshs access/refresh token for a user
     * @property /api/[version]/[database]/authentication/refresh url
     * @property {POST} Method - request method
     * @param {string} accessToken - access token you've got from login request
     * @param {string} refreshToken - refresh token you've got from login request
     * @return {string} id - user id
     * @return {string} username - username
     * @return {date} created - user creation date
     * @return {string[]} permissions - user permissions
     * @return {integer} expiresInMinutes - when access expires
     * @return {string} tokenType - access token type
     * @return {string} accessToken - token to authorize as logged in user
     * @return {string} refreshToken - token to generate access/refresh token if old access token expires
     * @throws 400 'missing_access_or_refresh_token' - if access or refresh token is missing
     * @throws 400 'invalid_refresh_token' - refresh token belongs not to the access token
     * @throws 403 - the access token not exists -> not loggedin
     * @throws 400 'user_not_found' - found no user to access token in database
    */
    rest.refresh = {
        permissions: [],
        models: ['authentication', 'user'],
        exec: function (req, res, Authentication, User) {
            var params = req.body;

            if (!params.accessToken || !params.refreshToken) {
                return res.send(400, {
                    'error': 'missing_access_or_refresh_token'
                });
            }

            Authentication.findOne({
                accessToken: params.accessToken
            }, function (err, authentication) {
                if (err) {
                    return res.send(500, {
                        error: err
                    });
                }
                if (!authentication) {
                    return res.send(403);
                }
                if (authentication.refreshToken !== params.refreshToken) {
                    return res.send(400, {
                        error: 'invalid_refresh_token'
                    });
                }
                User.findById(authentication.userId, function (usererr, user) {
                    if (usererr) {
                        return res.send(500, {
                            error: err
                        });
                    }
                    if (!user) {
                        return res.send(400, {
                            error: 'user_not_found'
                        });
                    }
                    authentication.remove(function (err) {
                        if (err) {
                            return res.send(500, {
                                error: err
                            });
                        }
                        generateAuthentication(user, Authentication, req.db.name).then(function (userData) {
                            res.send(userData);
                        }, function (err) {
                            res.send(500, {
                                error: err
                            });
                        });
                    });
                });
            });
        }
    };

    /**
     * @function logout
     * @description Logout
     * @property /api/[version]/[database]/authentication/logout - url
     * @property {GET} Method - request method
     * @property Authorization - set request header Authorization: TOKENTYPE ACCESSTOKEN
     * @throws 403 - not logged in -> permission denied
     */
    rest.logout = {
        permissions: [appConfig.permissions.user, appConfig.permissions.manager, appConfig.permissions.admin, appConfig.permissions.employee, appConfig.permissions.sysadmin],
        models: ['authentication'],
        exec: function (req, res, Authentication) {
            Authentication.findOne({
                accessToken: req.user.accessToken
            }, function (err, authentication) {
                if (err) {
                    return res.send(500, {
                        error: err
                    });
                }
                if (!authentication) {
                    return res.send(403);
                }
                authentication.remove(function (err) {
                    if (err) {
                        return res.send(500, err);
                    }
                    res.send();
                });
            });
        }
    };

    return {
        v1: {
            post : {
                // /authentication
                'login': rest.login,
                // refresh access token / authentication
                'refresh': rest.refresh
            },
            // logout request
            get: {
                'logout': rest.logout
            }
        }
    };
});