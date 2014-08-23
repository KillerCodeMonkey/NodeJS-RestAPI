/*global define*/
/*jslint vars:true*/
define([
    'winston'
], function (winston) {
    'use strict';

    var logger = new winston.Logger({
        transports: [new winston.transports.Console({
            prettyPrint: true,
            handleExceptions: true
        })]
    });

    return logger;
});