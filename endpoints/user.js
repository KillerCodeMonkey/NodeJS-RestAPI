define([
    'appConfig'
], function (appConfig) {
    'use strict';
    var rest = {};

    // get current logged in user
    rest.account = {
        permissions: [appConfig.permissions.user],
        exec: function (req, res) {
            if (!req.user) {
                return res.send(403);
            }
            res.send(req.user);
        }
    };

    // get user object
    rest.object = {
        permissions: [],
        exec: function (req, res) {
            if (!req.object) {
                return res.send(403);
            }
            res.send(req.object);
        }
    };

    // get username
    rest.username = {
        permissions: [],
        exec: function (req, res) {
            var object = req.object;
            res.send({
                name: object.username
            });
        }
    };

    // get userlist
    rest.userlist = {
        permissions: [appConfig.permissions.sysadmin, appConfig.permissions.admin],
        models: ['user'],
        exec: function (req, res, User) {
            User.find({}, function (err, users) {
                if (err) {
                    return res.send(400, err);
                }
                res.send(users);
            });
        }
    };

    // register
    rest.register = {
        models: [appConfig.permissions.user],
        exec: function (req, res, User) {
            var params = req.body,
                user;

            if (req.user) {
                return res.send(400, {
                    error: 'already_logged_in'
                });
            }
            User.findOne({
                $or: [{
                    username: params.username
                }, {
                    email: params.email
                }]
            }, function (err, existingUser) {
                if (err) {
                    return res.send(400, err);
                }
                if (existingUser) {
                    return res.send(400, {
                        error: 'username_email_exists'
                    });
                }
                user = new User(params);

                user.save(function (err) {
                    if (err) {
                        return res.send(400, err);
                    }
                    return res.send(200);
                });
            });
        }
    };

    return {
        v1 : {
            post : {
                'register': rest.register
            },
            get: {
                'account': rest.account,
                'object': rest.object,
                'username': rest.username,
                '': rest.userlist
            }
        }
    };
});