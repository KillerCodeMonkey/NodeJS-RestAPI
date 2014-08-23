RestAPI [![Build Status](https://travis-ci.org/KillerCodeMonkey/restAPI.svg?branch=master)](https://travis-ci.org/KillerCodeMonkey/restAPI)
================
NodeJS/MongoDB REST-API with token authentication and multidb support

This is an example how to create a flexible rest api with nodejs + mongodb, permission handling, multidb support (+ caching connections), documented endpoints, test cases and using test/build-runners like travis-ci

Installation
============
Requirements
------------
1. install nodejs
  * `sudo apt-get update`
  * `sudo apt-get install -y gcc g++ make`
  * `wget http://nodejs.org/dist/node-latest.tar.gz`
  * `tar -xzvf node-latest.tar.gz`
  * `cd [CREATED NODE DIR]`
  * `./configure`
  * `make`
  * `sudo make install`
  * `curl https://www.npmjs.org/install.sh | sh`
  * if curl is missing run `apt-get install curl`
2. install mongodb (check if version >2.6.x)
  * open http://docs.mongodb.org/manual/tutorial/install-mongodb-on-debian/
  * Follow the installation instructions (Point 1 - 4)
3. clone repo & go in directory
4. run `npm install` to install all dependencies
5. run `npm install -g grunt-cli`
6. set configs in ./config and run following commands (optional)

API - New Way
-------------
1. run `grunt exec:install`

After you have configured your mongo and installed the system the first time you only need grunt reinstall to install demodata and grunt to start server (hopefully).
Your system admin credentials:
* login: test
* pw: 1234

Start
=====
* after reboot of your VM/System run
  * `grunt exec:killDB`
  * `grunt exec:startDB`
  * `grunt`

Documentation
=============
* current documentation open: docs/index.html
* generate documentation with `grunt exec:doc`

Tests
=====
* run `grunt tests`
* there should be a testcase for each endpoint (success and failure cases)

Explanation
===========
* index.js -> init server and workers (clustering)
* appServer.js -> express server, request handling, middleware for authentication
* config -> db, app, require, logging configs
* endpoints -> rest endpoints
* models -> db models (schema and model)
* middleware -> custom express middleware for authentication and multidb handling, store selection
* util -> handler and other tools
* tests -> testcases

Models & Endpoints
=================
* model and endpoint file (if there are endpoints for a model -> model and endpoint must have the same name)
* on startup all models are loaded and for all models the entpoint file
* model registers the mongoose model with its schema
* Versioning
* MultiDB support: '/api/:version/:database/:classname/id/:id/:action' -> for each client an own db
* endpoint file returns an object with keys for each method (post, get, put, delete) as values another object with keys '', 'object', '{actionname}'. '' stands for request without objectid like '/api/user'. 'object' for a object call like '/api/v1/restAPI/user/:id' where the object is placed automatically on req.object. '{actionname}' could be used if the default methods are not enough for any purpose like GET '/api/v1/restAPI/user/id/:id/rating' or GET '/api/v1/restAPI/user/activeOnes'.
* additional systemdb for managing/monitoring purposes (or if you need a backoffice for other dbs)
* a model returns mongoose schema, mongo model, and optionally systemdb flag (systemdb: true -> this model is only für systemdb, systemdb: false -> only for the other dbs, not set -> for otherdbs and systemdb)