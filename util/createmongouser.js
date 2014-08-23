/*global Mongo*/
/*global host, port, admin, user, adminpassword, password*/
/*jslint vars:true,plusplus:true*/

(function () {
    'use strict';

    var conn = new Mongo(host + ':' + port);
    var db = conn.getDB('admin');

    db.addUser({
        user: admin,
        pwd: adminpassword,
        roles: ['clusterAdmin', 'userAdminAnyDatabase']
    });

    db.auth(admin, adminpassword);

    db.addUser({
        user: user,
        pwd: password,
        roles: ['readWriteAnyDatabase']
    });
}());