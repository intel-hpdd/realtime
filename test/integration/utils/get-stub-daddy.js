'use strict';

var getStubDaddy = require('intel-stub-daddy');
var conf = require('../../../conf');
var url = require('url');

module.exports = function invokeStubDaddy () {
  var stubDaddy = getStubDaddy({port: url.parse(conf.SERVER_HTTP_URL).port});

  return stubDaddy;
};
