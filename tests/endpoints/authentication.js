/*globals before, after, it, describe */
var request = require('supertest'),
    expect = require('expect.js'),
    require = require('../../config/require'),
    app,
    accessToken,
    refreshToken;


describe('Authentication model', function () {

    before(function (done) {
        require(['appServer'], function (appServer) {
            appServer.then(function (server) {
                app = server;
                done();
            }, done);
        });
    });

    after(function (done) {
        app.close();
        done();
    });

    describe('GET /api - check if api is online', function () {
        it('200 - response code', function (done) {
            request(app)
                .get('/api')
                .expect(200, done);
        });
        it('200 - response "api_online"', function (done) {
            request(app)
                .get('/api')
                .expect(200)
                .expect('api_online', done);
        });
    });

    describe('POST /authentication/login - login', function () {
        it('200 - response code', function (done) {
            request(app)
                .post('/api/v1/test/authentication/login')
                .send({
                    'login': 'test@test.com',
                    'password': '1234'
                })
                .expect(200, done);
        });
        it('400 - wrong password', function (done) {
            request(app)
                .post('/api/v1/test/authentication/login')
                .send({
                    'login': 'test@test.com',
                    'password': '12345'
                })
                .expect(400)
                .end(function (err, res) {
                    var data = res.body;
                    if (err) {
                        done(err);
                    } else {
                        expect(data).not.to.be(null);
                        expect(data).to.be.an('object');
                        expect(data.error).not.to.be(null);
                        expect(data.error).to.be.a('string');
                        expect(data.error).to.be('invalid_login_password_combination');
                        done();
                    }
                });
        });
        it('400 - invalid user', function (done) {
            request(app)
                .post('/api/v1/test/authentication/login')
                .send({
                    'login': 'tes',
                    'password': '1234'
                })
                .expect(400)
                .end(function (err, res) {
                    var data = res.body;
                    if (err) {
                        done(err);
                    } else {
                        expect(data).not.to.be(null);
                        expect(data).to.be.an('object');
                        expect(data.error).not.to.be(null);
                        expect(data.error).to.be.a('string');
                        expect(data.error).to.be('user_not_exists');
                        done();
                    }
                });
        });
        it('400 - missing user', function (done) {
            request(app)
                .post('/api/v1/test/authentication/login')
                .send({
                    'password': '1234'
                })
                .expect(400)
                .end(function (err, res) {
                    var data = res.body;
                    if (err) {
                        done(err);
                    } else {
                        expect(data).not.to.be(null);
                        expect(data).to.be.an('object');
                        expect(data.error).not.to.be(null);
                        expect(data.error).to.be.a('string');
                        expect(data.error).to.be('missing_login_or_password');
                        done();
                    }
                });
        });
        it('400 - missing password', function (done) {
            request(app)
                .post('/api/v1/test/authentication/login')
                .send({
                    'login': '1234'
                })
                .expect(400)
                .end(function (err, res) {
                    var data = res.body;
                    if (err) {
                        done(err);
                    } else {
                        expect(data).not.to.be(null);
                        expect(data).to.be.an('object');
                        expect(data.error).not.to.be(null);
                        expect(data.error).to.be.a('string');
                        expect(data.error).to.be('missing_login_or_password');
                        done();
                    }
                });
        });
        it('200 - missing user && password', function (done) {
            request(app)
                .post('/api/v1/test/authentication/login')
                .expect(400)
                .end(function (err, res) {
                    var data = res.body;
                    if (err) {
                        done(err);
                    } else {
                        expect(data).not.to.be(null);
                        expect(data).to.be.an('object');
                        expect(data.error).not.to.be(null);
                        expect(data.error).to.be.a('string');
                        expect(data.error).to.be('missing_login_or_password');
                        done();
                    }
                });
        });
        it('200 - login with username', function (done) {
            request(app)
                .post('/api/v1/test/authentication/login')
                .send({
                    'login': 'test',
                    'password': '1234'
                })
                .expect(200, done);
        });
        it('200 - valid response data', function (done) {
            request(app)
                .post('/api/v1/test/authentication/login')
                .send({
                    'login': 'test@test.com',
                    'password': '1234'
                })
                .end(function (err, res) {
                    var data = res.body;

                    if (err) {
                        done(err);
                    } else {
                        expect(data).not.to.be(null);
                        expect(data).to.be.an('object');
                        expect(data.accessToken).not.to.be(null);
                        expect(data.accessToken).to.be.a('string');
                        expect(data.refreshToken).not.to.be(null);
                        expect(data.refreshToken).to.be.a('string');
                        expect(data.refreshToken).not.to.be(null);
                        expect(data.tokenType).to.be('Bearer');
                        expect(data.refreshToken).not.to.be(null);
                        expect(data.email).to.be('test@test.com');
                        expect(data.permissions).not.to.be(null);
                        expect(data.permissions).to.be.an('array');
                        expect(data.permissions).to.be.eql(['user']);
                        accessToken = data.accessToken;
                        refreshToken = data.refreshToken;
                        done();
                    }
                });
        });
        it('400 - already logged in', function (done) {
            request(app)
                .post('/api/v1/test/authentication/login')
                .set('Authorization', 'Bearer ' + accessToken)
                .send({
                    'login': 'test@test.com',
                    'password': '1234'
                })
                .expect(400)
                .end(function (err, res) {
                    var data = res.body;
                    if (err) {
                        done(err);
                    } else {
                        expect(data).not.to.be(null);
                        expect(data).to.be.an('object');
                        expect(data.error).not.to.be(null);
                        expect(data.error).to.be('already_logged_in');
                        done();
                    }
                });
        });
    });
    describe('POST /authentication/refresh - refresh access/refreshtoken', function () {
        it('200 - refresh tokens', function (done) {
            request(app)
                .post('/api/v1/test/authentication/refresh')
                .send({
                    'accessToken': accessToken,
                    'refreshToken': refreshToken
                })
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        done(err);
                    }
                    var data = res.body;
                    expect(data).not.to.be(null);
                    expect(data).to.be.an('object');
                    expect(data.accessToken).not.to.be(null);
                    expect(data.accessToken).to.be.a('string');
                    expect(data.refreshToken).not.to.be(null);
                    expect(data.refreshToken).to.be.a('string');
                    accessToken = data.accessToken;
                    refreshToken = data.refreshToken;
                    done();
                });
        });
        it('200 - refresh with new tokens', function (done) {
            request(app)
                .post('/api/v1/test/authentication/refresh')
                .send({
                    'accessToken': accessToken,
                    'refreshToken': refreshToken
                })
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        done(err);
                    }
                    var data = res.body;
                    expect(data).not.to.be(null);
                    expect(data).to.be.an('object');
                    expect(data.accessToken).not.to.be(null);
                    expect(data.accessToken).to.be.a('string');
                    expect(data.refreshToken).not.to.be(null);
                    expect(data.refreshToken).to.be.a('string');
                    accessToken = data.accessToken;
                    refreshToken = data.refreshToken;
                    done();
                });
        });
        it('403 - wrong accessToken', function (done) {
            request(app)
                .post('/api/v1/test/authentication/refresh')
                .send({
                    'accessToken': '1234',
                    'refreshToken': refreshToken
                })
                .expect(403, done);
        });
        it('400 - wrong refreshToken', function (done) {
            request(app)
                .post('/api/v1/test/authentication/refresh')
                .send({
                    'accessToken': accessToken,
                    'refreshToken': '1234'
                })
                .expect(400)
                .end(function (err, res) {
                    var data = res.body;
                    if (err) {
                        return done(err);
                    }
                    expect(data).not.to.be(null);
                    expect(data).to.be.an('object');
                    expect(data.error).not.to.be(null);
                    expect(data.error).to.be.an('string');
                    expect(data.error).to.be('invalid_refresh_token');
                    done();
                });
        });
        it('400 - missing accessToken', function (done) {
            request(app)
                .post('/api/v1/test/authentication/refresh')
                .send({
                    'refreshToken': refreshToken
                })
                .expect(400)
                .end(function (err, res) {
                    var data = res.body;
                    if (err) {
                        return done(err);
                    }
                    expect(data).not.to.be(null);
                    expect(data).to.be.an('object');
                    expect(data.error).not.to.be(null);
                    expect(data.error).to.be.an('string');
                    expect(data.error).to.be('missing_access_or_refresh_token');
                    done();
                });
        });
        it('400 - missing refreshToken', function (done) {
            request(app)
                .post('/api/v1/test/authentication/refresh')
                .send({
                    'accessToken': accessToken
                })
                .expect(400)
                .end(function (err, res) {
                    var data = res.body;
                    if (err) {
                        return done(err);
                    }
                    expect(data).not.to.be(null);
                    expect(data).to.be.an('object');
                    expect(data.error).not.to.be(null);
                    expect(data.error).to.be.an('string');
                    expect(data.error).to.be('missing_access_or_refresh_token');
                    done();
                });
        });
        it('400 - missing access && refreshToken', function (done) {
            request(app)
                .post('/api/v1/test/authentication/refresh')
                .expect(400)
                .end(function (err, res) {
                    var data = res.body;
                    if (err) {
                        return done(err);
                    }
                    expect(data).not.to.be(null);
                    expect(data).to.be.an('object');
                    expect(data.error).not.to.be(null);
                    expect(data.error).to.be.an('string');
                    expect(data.error).to.be('missing_access_or_refresh_token');
                    done();
                });
        });
    });
    describe('GET /authentication/logout - logout', function () {
        it('403 - without authorization header', function (done) {
            request(app)
                .get('/api/v1/test/authentication/logout')
                .expect(403, done);
        });
        it('200 - correct logout', function (done) {
            request(app)
                .get('/api/v1/test/authentication/logout')
                .set('Authorization', 'Bearer ' + accessToken)
                .expect(200, done);
        });
    });
});