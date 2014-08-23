/*globals before, after, it, describe */
var request = require('supertest'),
    expect = require('expect.js'),
    promise = require('node-promise'),
    Promise = promise.Promise,
    require = require('../../config/require'),
    app,
    dbConfig,
    accessToken,
    refreshToken,
    restURL,
    clients = [],
    client;

function del(id) {
    'use strict';
    var q = new Promise();

    request(app)
        .del(restURL + '/client/id/' + id)
        .set('Authorization', 'Bearer ' + accessToken)
        .end(function (err) {
            if (err) {
                q.reject(err);
            } else {
                q.resolve();
            }
        });

    return q;
}

function buildName(alias) {
    'use strict';
    return alias.toString().match(/[0-9]{3}/g).join('.');
}


describe('client model', function () {

    before(function (done) {
        require(['appServer', 'databaseConfig'], function (appServer, databaseConfig) {
            appServer.then(function (server) {
                app = server;
                dbConfig = databaseConfig;
                restURL = '/api/v1/' + dbConfig.systemdb;
                done();
            }, done);
        });
    });

    after(function (done) {
        var tasks = [];

        request(app)
            .get(restURL + '/client')
            .set('Authorization', 'Bearer ' + accessToken)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                var i = 0,
                    clients = res.body;
                for (i; i < clients.length; i = i + 1) {
                    tasks.push(del(clients[i]));
                }
                promise.all(tasks).then(function () {
                    done();
                }, done);
            });
    });

    describe('POST /authentication/login - login as sysadmin', function () {
        it('200 - response code', function (done) {
            request(app)
                .post(restURL +  '/authentication/login')
                .send({
                    'login': 'test',
                    'password': '1234'
                })
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    var data = res.body;

                    accessToken = data.accessToken;
                    refreshToken = data.refreshToken;
                    done();
                });
        });
    });

    describe('POST /client - create first client', function () {
        it('200 - create client', function (done) {
            request(app)
                .post(restURL + '/client')
                .set('Authorization', 'Bearer ' + accessToken)
                .send({
                    alias: 'test1',
                    name: 'test1'
                })
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    var data = res.body;

                    expect(data).not.to.be(null);
                    expect(data).to.be.an('object');

                    expect(data.alias).to.be.eql('test1');
                    expect(data.name).to.be.eql('test1');
                    expect(data.active).to.be(false);
                    clients.push(data._id);
                    client = data;
                    done();
                });
        });
        it('200 - create another client', function (done) {
            request(app)
                .post(restURL + '/client')
                .set('Authorization', 'Bearer ' + accessToken)
                .send({
                    alias: 'test2',
                    name: 'test2'
                })
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    var data = res.body;

                    expect(data).not.to.be(null);
                    expect(data).to.be.an('object');
                    expect(data.alias).to.be.eql('test2');
                    expect(data.name).to.be.eql('test2');
                    expect(data.active).to.be(false);
                    clients.push(data._id);
                    done();
                });
        });
        it('403 - create client without login', function (done) {
            request(app)
                .post(restURL + '/client')
                .send({
                    'alias': 'NEW TEST CLIENT'
                })
                .expect(403, done);
        });
    });

    describe('GET /client - gets client list', function () {
        it('200 - get list', function (done) {
            request(app)
                .get(restURL + '/client')
                .set('Authorization', 'Bearer ' + accessToken)
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    var data = res.body,
                        i = 0,
                        createdFound = [];
                    expect(data).not.to.be(null);
                    expect(data).to.be.an('array');
                    expect(data.length).to.be.greaterThan(1);
                    for (i; i < data.length; i = i + 1) {
                        if (clients.indexOf(data[i]._id) > -1) {
                            createdFound.push(true);
                        }
                    }
                    expect(createdFound.length).to.be(clients.length);
                    done();
                });
        });
        it('403 - without authorization header', function (done) {
            request(app)
                .get(restURL + '/client')
                .expect(403, done);
        });
    });
    describe('GET /client/active - gets active client list', function () {
        it('200 - get list', function (done) {
            request(app)
                .get(restURL + '/client/active')
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    var data = res.body,
                        i = 0;

                    expect(data).not.to.be(null);
                    expect(data).to.be.an('array');
                    for (i; i < data.length; i = i + 1) {
                        expect(data[i].active).to.be(true);
                    }
                    done();
                });
        });
    });
    describe('GET /client/[id] - get client', function () {
        it('200 - get client', function (done) {
            request(app)
                .get(restURL + '/client/id/' + clients[0])
                .set('Authorization', 'Bearer ' + accessToken)
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    var data = res.body;
                    expect(data).not.to.be(null);
                    expect(data).to.be.an('object');
                    expect(data.alias).to.be(client.alias);
                    expect(data.name).to.be(client.name);
                    expect(data.active).to.be(false);
                    done();
                });
        });
        it('403 - without authorization header', function (done) {
            request(app)
                .get(restURL + '/client/id/' + clients[0])
                .expect(403, done);
        });
    });

    describe('PUT /client/[id] - update client', function () {
        it('200 - update client', function (done) {
            request(app)
                .put(restURL + '/client/id/' + clients[0])
                .set('Authorization', 'Bearer ' + accessToken)
                .send({
                    active: true
                })
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    var data = res.body;
                    expect(data).not.to.be(null);
                    expect(data).to.be.an('object');
                    expect(data.active).to.be(true);
                    expect(data.alias).to.be.eql(client.alias);
                    done();
                });
        });
        it('403 - without authorization header', function (done) {
            request(app)
                .put(restURL + '/client/id/' + clients[0])
                .expect(403, done);
        });
    });

    describe('DELETE /client/[id] - remove client', function () {
        it('403 - without authorization header', function (done) {
            request(app)
                .del(restURL + '/client/id/' + clients[0])
                .expect(403, done);
        });
        it('200 - remove client 1', function (done) {
            request(app)
                .del(restURL + '/client/id/' + clients[0])
                .set('Authorization', 'Bearer ' + accessToken)
                .expect(200, done);
        });
        it('200 - remove client 2', function (done) {
            request(app)
                .del(restURL + '/client/id/' + clients[1])
                .set('Authorization', 'Bearer ' + accessToken)
                .expect(200, done);
        });
        it('404 - get removed client 1', function (done) {
            request(app)
                .get(restURL + '/client/id/' + clients[0])
                .set('Authorization', 'Bearer ' + accessToken)
                .expect(404, done);
        });
        it('404 - get removed client 2', function (done) {
            request(app)
                .get(restURL + '/client/id/' + clients[1])
                .set('Authorization', 'Bearer ' + accessToken)
                .expect(404, done);
        });
    });
});