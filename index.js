/*global require*/
/*jslint vars:true,plusplus:true,node:true*/
(function (require) {
    'use strict';
    require = require('./config/require');

    var log = require('log');

    var cluster = require('cluster');
    var numCPUs = require('os').cpus().length;

    if (cluster.isMaster) {
        // Fork workers.
        var workers = numCPUs;
        var i;
        for (i = 0; i < workers; i++) {
            cluster.fork();
        }

        cluster.on('fork', function (worker) {
            log.info('The worker #' + worker.id + ' is created');
        });

        cluster.on('online', function (worker) {
            log.info('The worker #' + worker.id + ' is ready to work');
        });

        cluster.on('disconnect', function (worker) {
            log.info('The worker #' + worker.id + ' has disconnected');
        });

        cluster.on('exit', function (worker) {
            log.info('worker ' + worker.id + ' died');
            cluster.fork();
        });
    } else {
        require('appServer');
    }
}(require));