'use strict';

module.exports = init;

const debug = require('debug')('swagger:hapi_middleware');

function init(runner) {
  return new Hapi(runner);
}

function Hapi(runner) {
  this.runner = runner;
  this.config = runner.config;

  let connectMiddleware = runner.connectMiddleware();
  let chain = connectMiddleware.middleware();

  this.plugin = {
    register: async (server, options) => {
      server.ext('onRequest', function(request, h) {
        return new Promise((resolve, reject) => {
          let req = request.raw.req;
          let res = newResponse(h, resolve, reject);
          chain(req, res, function(err) {
            if (err) {
              if (err.statusCode) { res.statusCode = err.statusCode; }
              res.end(err.message);
            } else {
              res.finish();
            }
          });
        });
      });

      /* istanbul ignore next */
      server.events.on('request', function (request, event, tags) {
        if (event.error) {
          debug('Request: %s error: %s', request.id, event.error.stack);
        }
      });
    },
    name: 'swagger-node-runner',
    version: version(),
  };
}

function version() {
  return require('../package.json').version;
}

function newResponse(h, resolve, reject) {
  return {
    getHeader: function getHeader(name) {
      return this.headers ? this.headers[name.toLowerCase()] : null;
    },
    setHeader: function setHeader(name, value) {
      if (!this.headers) { this.headers = {}; }
      this.headers[name.toLowerCase()] = value;
    },
    end: function end(string) {
      this.res = h.response(string).takeover();
      this.res.statusCode = this.statusCode;
      if (this.headers) {
        for (var header in this.headers) {
          this.res.header(header, this.headers[header]);
        }
      }
      resolve(this.res);
    },
    finish: function finish() {
      if (!this.res) {
        resolve(h.continue);
      }
    }
  };
}
