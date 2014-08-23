/*global module, grunt, require:true*/
/*jslint vars:true*/
/* istanbul ignore next */
module.exports = function (grunt) {
    'use strict';

    require = require('./config/require');
    var dbconfig = require('databaseConfig'),
        System = require('util/system');

    var DBPATH = dbconfig.dbpath;
    grunt.file.mkdir(DBPATH);

    var db = grunt.option('target') || 'test';

    var reporter = grunt.option('reporter');

    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-exec');
    grunt.loadNpmTasks('grunt-contrib-clean');

    grunt.initConfig({
        mochaTest: {
            test: {
                options: {
                    timeout: 10000,
                    reporter: reporter || 'spec'
                },
                src: ['tests/*/*.js']
            }
        },

        exec: {
            createMongoUsers: {
                command: 'mongo ' + dbconfig.host + ':' + dbconfig.port + ' --eval "var host=\'' + dbconfig.host + '\', port=\'' + dbconfig.port + '\', admin=\'' + dbconfig.admin + '\', adminpassword=\'' + dbconfig.adminpassword + '\', user=\'' + dbconfig.username + '\', password=\'' + dbconfig.password + '\';" util/createmongouser.js'
            },

            killDB: {
                command: 'killall mongod || true'
            },

            startFirstDB: {
                command: 'mongod --dbpath=' + DBPATH + ' --port=' + dbconfig.port + ' &'
            },

            startDB: {
                command: 'mongod -v --logpath static/db/server1.log --logappend --dbpath=' + DBPATH + ' --port=' + dbconfig.port + ' --auth &',
                stdout: true,
                stderr: true
            },

            repair: {
                command: [
                    'grunt exec:killDB',
                    'grunt exec:setCorrectPermissions',
                    'grunt exec:repairDB',
                    'grunt exec:startDB'
                ].join('&&')
            },

            install: {
                command: [
                    'grunt exec:killDB',
                    'grunt clean:mongo',
                    'grunt exec:startFirstDB',
                    'grunt exec:createMongoUsers',
                    'grunt exec:killDB',
                    'grunt exec:startDB',
                    'grunt initSystem',
                    'grunt reinstall'
                ].join('&&')
            },

            setCorrectPermissions: {
                command: [
                    'chown -cR mongodb ' + DBPATH,
                    'chgrp -cR mongodb ' + DBPATH
                ].join('&&')
            },

            repairDB: {
                command: 'mongod --repair --dbpath ' + DBPATH
            },

            startNode: {
                command: 'node index'
            },

            doc: {
                command: [
                    'rm -rf docs',
                    'jsdoc appServer.js endpoints/*.js -d docs'
                ].join('&&')
            }
        },

        jsdoc : {
            dist : {
                src: ['endpoints/*.js'],
                options: {
                    destination: 'doc'
                }
            }
        },

        clean: {
            db: ['static/public/' + db],
            mongo: [DBPATH],
            all: ['static/*']
        }
    });

    /*jslint regexp:true*/
    var buildParams = function (flags) {
        var params = {};

        flags.forEach(function (flag) {
            var truematch = /--([^\s=]+)$/.exec(flag);

            if (truematch) {
                params[truematch[1]] = true;
                return;
            }

            var nomatch = /--no-([^\s=]+)$/.exec(flag);

            if (nomatch) {
                params[nomatch[1]] = false;
                return;
            }

            var match = /--([^\s=]+)=([^\s=]+)/.exec(flag);
            if (match) {
                params[match[1]] = match[2];
            }
        });

        return params;
    };
    /*jslint regexp:false*/

    var reinstall = function () {
        var flags = grunt.option.flags();
        var params = buildParams(flags);

        var done = this.async();
        var init = require('util/democontent');

        var database = params.target || db;
        init(database, params).then(function () {
            done();
        }, grunt.log.error);
    };

    var createSystem = function () {
        var flags = grunt.option.flags();
        var params = buildParams(flags);

        params.username = params.username || 'test';
        params.password = params.password || '1234';

        var done = this.async();
        System.createSystem(params.username, params.password).then(function () {
            done();
        }, grunt.log.error);
    };

    grunt.registerTask('initSystem', createSystem);
    grunt.registerTask('createcontent', reinstall);
    grunt.registerTask('reinstall', ['clean:db', 'createcontent']);
    grunt.registerTask('start', ['exec:startNode']);
    grunt.registerTask('tests', ['mochaTest']);
    grunt.registerTask('default', 'start');
};