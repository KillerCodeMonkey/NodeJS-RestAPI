define([
    'mongoose'
], function (mongoose) {
    'use strict';

    var Schema = mongoose.Schema,
        // AccessToken
        AccessToken = new Schema({
            userId: {
                type: String,
                required: true
            },
            secret: {
                type: String,
                required: true
            },
            accessToken: {
                type: String,
                unique: true,
                required: true
            },
            refreshToken: {
                type: String,
                required: true
            },
            created: {
                type: Date,
                'default': Date.now
            }
        }),
        AccessTokenModel = mongoose.model('AccessToken', AccessToken);

    return {
        model: AccessTokenModel,
        schema: AccessToken
    };
});