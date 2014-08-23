define(function () {
    'use strict';

    return {
        port: '8000',
        secret: 'eifvdn9843(&T423?=90*#+_:21387SkjwnH_=',
        tokenExpiresInMinutes: 120,
        defaultClient: 'test',
        permissions: {
            'admin': 'admin',
            'sysadmin': 'sysadmin',
            'user': 'user'
        }
    };
});