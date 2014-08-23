/** @file appServer.js Endpoints for app request
 *  @module Other
 * */
define([
    'path',
    'node-promise',
    'express',
    'body-parser',
    'method-override',
    'errorhandler',
    'log',
    'appConfig',
    'databaseConfig',
    'util/actionHandler',
    'util/modelEndpointHandler',
    'middleware/authentication',
    'middleware/dbconnection'
], /** @lends Other */ function (path, promise, express, bodyParser, methodOverride, errorHandler, log, appConfig, databaseConfig, actionHandler, modelEndpointHandler, authentication, dbconnection) {
    'use strict';

    var app = express(),
        server,
        Promise = promise.Promise,
        q = new Promise();

    // load models and endpoints
    modelEndpointHandler.load().then(function (results) {
        var models = results[0],
            endpoints = results[1];

        // get called action
        function execAction(req, res) {
            var params = req.params,
                className = params.classname,
                version = params.version,
                isObject = params.objectid ? true : false,
                endpoint;

            // load model and endpoint by class
            if (version && className && models[className] && endpoints[className]) {
                endpoint = endpoints[className];

                return actionHandler(req, res, endpoint, isObject);
            }
            res.send(404, 'no_classname');
        }

        // Config
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({
            extended: true
        }));
        app.use(methodOverride()); // HTTP PUT and DELETE support
        app.use(express.static(path.join(process.cwd(), 'static', 'public'))); // static file server
        app.use(errorHandler({ dumpExceptions: true, showStack: true })); // error stacks
        app.param('db', dbconnection); // use dbconnection cache
        app.param('db', authentication); // use authentication middleware

        // Launch server
        server = app.listen(appConfig.port, function () {
            log.info('Listening on port %d', server.address().port);
        });

        /**
         * @function api
         * @description Checks if api is online
         * @property /api - url
         * @property {GET} Method - request method
         * @property Authorization - set request header Authorization: TOKENTYPE ACCESSTOKEN
         * @return {string} api_online - returned as request.text
         */
        app.get('/api', function (req, res) {
            res.send('api_online');
        });
        /**
         * @function api/config
         * @description returns system config
         * @property /api/config - url
         * @property {GET} Method - request method
         * @return {object} systemconfig - system config with default values for e.g. interests, roles, message types
         */
        app.get('/api/config', function (req, res) {
            // deep clone appConfig object
            var resAppConfig = JSON.parse(JSON.stringify(appConfig));

            delete resAppConfig.secret;
            resAppConfig.version = 'v1';
            resAppConfig.systemdb = databaseConfig.systemdb;

            res.send(resAppConfig);
        });

        // set generic provided api class urls
        app.all('/api/:version/:db/:classname/:action?', execAction);
        // set generic provided api object urls
        app.all('/api/:version/:db/:classname/id/:objectid/:action?', execAction);

        q.resolve(server);

    }, log.error);

    return q;
});