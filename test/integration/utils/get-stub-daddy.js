"use strict";

var getStubDaddy = require("@iml/stub-daddy").default;
var conf = require("../../../conf");
var url = require("url");

module.exports = function invokeStubDaddy() {
  var stubDaddy = getStubDaddy({ port: url.parse(conf.SERVER_HTTP_URL).port });

  return stubDaddy;
};
