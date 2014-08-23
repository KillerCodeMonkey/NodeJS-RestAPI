define([
    'util/modelEndpointHandler'
], function (modelEndpointHandler) {
    'use strict';

    function checkStore(req, action) {
        var correct = true;

        // check if action needs store -> check if store is on request
        if (action.store && !req.store) {
            correct = false;
        }

        return correct;
    }

    function checkPermissions(req, action) {
        var correct = false,
            i = 0;

        // check if action has permissions.
        if (action.permissions && action.permissions.length > 0) {
            // check if token auth puts user object on req.user has permissions
            if (req.user && req.user.permissions) {
                // check if user has required permission by action
                for (i; i < req.user.permissions.length; i = i + 1) {
                    if (action.permissions.indexOf(req.user.permissions[i]) > -1) {
                        correct = true;
                        break;
                    }
                }
            }
        } else {
            correct = true;
        }
        return correct;
    }

    return function (req, res, endpoint, isObjectRequest) {
        var action,
            params = req.params,
            method = req.method.toLowerCase(),
            actionList;

        if (!endpoint[params.version] || !endpoint[params.version][method]) {
            return res.send(404);
        }
        actionList = endpoint[params.version][method];

        // request has an objectid.
        if (isObjectRequest) {
            if (!params.objectid) {
                return res.send(404, 'objectid_not_found');
            }
            // if there is special action.
            if (params.action) {
                // check if action exists.
                if (!actionList[params.action]) {
                    return res.send(404, 'action_not_found');
                }
                action = actionList[params.action];
            } else {
                // load default object action 'object'.
                if (!actionList.object) {
                    return res.send(404, 'action_not_found');
                }
                action = actionList.object;
            }

            // check if user has correct permissions or it is a system user
            if (checkPermissions(req, action) && checkStore(req, action)) {
                // try to find object of class model.
                modelEndpointHandler.initDb(req, res, [params.classname], function (req, res, model) {
                    model.findById(params.objectid, function (err, object) {
                        if (err) {
                            return res.send(404, err);
                        }
                        if (!object) {
                            return res.send(404, 'object_not_found');
                        }
                        // put object on req.object.
                        req.object = object;
                        modelEndpointHandler.initDb(req, res, action.models, action.exec);
                    });
                });
            } else {
                return res.send(403, 'permission_denied');
            }
        } else {
            // if action is set
            if (params.action) {
                // check if actions exists.
                if (!actionList[params.action]) {
                    return res.send(404, 'action_not_found');
                }
                action = actionList[params.action];
            } else {
                // check if default class action '' exists.
                if (!actionList['']) {
                    return res.send(404, 'action_not_found');
                }
                action = actionList[''];
            }

            // check if user has correct permissions or it is a system user
            if (checkPermissions(req, action) && checkStore(req, action)) {
                modelEndpointHandler.initDb(req, res, action.models, action.exec);
            } else {
                return res.send(403, 'permission_denied');
            }
        }
    };
});