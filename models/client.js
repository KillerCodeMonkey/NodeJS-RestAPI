// not a real needed model but i do not want to break the app structure.
define([
    'mongoose'
], function (mongoose) {
    'use strict';

    var Schema = mongoose.Schema,
    // Action schema
        Client = new Schema({
            alias: {
                type: String,
                required: true,
                unique: true
            },
            name: {
                type: String,
                required: true,
                unique: true
            },
            active: {
                type: Boolean,
                required: true,
                'default': false
            },
            host: String,
            user: String,
            password: String,
            port: String
        }),
        ClientModel = mongoose.model('Client', Client);

    return {
        model: ClientModel,
        schema: Client,
        systemdb: true
    };
});