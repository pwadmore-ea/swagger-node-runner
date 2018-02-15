'use strict';

var should = require('should');
var path = require('path');
var _ = require('lodash');

var SwaggerRunner = require('../..');

var TEST_PROJECT_ROOT = path.resolve(__dirname, '..', 'assets', 'project');
var TEST_PROJECT_CONFIG = { appRoot: TEST_PROJECT_ROOT };
var MOCK_CONFIG = {
  appRoot: TEST_PROJECT_ROOT,
  bagpipes: {_router: {mockMode: true}}
};

describe('hapi_middleware', function() {

  describe('standard', function() {
    before(function(done) {
      createServer.call(this, TEST_PROJECT_CONFIG, done);
    });

    after(function(done) {
      var self = this;
      (async function () {
        await self.app.stop();
        done();
      })();
    });

    require('./common')();
  });

  describe('mock', function() {

    before(function(done) {
      createServer.call(this, MOCK_CONFIG, done);
    });

    after(function(done) {
      var self = this;
      (async function () {
        await self.app.stop();
        done();
      })();
    });

    require('./common_mock')();
  });
});

function createServer(config, done) {
  var hapi = require('hapi');
  this.app = new hapi.Server({
    port: 7236
  });
  var self = this;
  SwaggerRunner.create(config, function(err, r) {
    if (err) {
      console.error(err);
      return done(err);
    }
    self.runner = r;
    var middleware = self.runner.hapiMiddleware();

    (async function () {
      try {
        self.app.events.on('start', function() {
          done();
        });
        await self.app.register(middleware.plugin);
        await self.app.start();
      } catch (err) {
        console.error('Failed to load plugin:', err);
        done(err);
      }
    })();

    self.app.address = function() { return { port: 7236 }; };
  });
}
