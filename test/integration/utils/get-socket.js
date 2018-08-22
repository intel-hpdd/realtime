"use strict";
var client = require("socket.io-client");
var conf = require("../../../conf");
var format = require("util").format;

module.exports = function invokeSocket(extraHeaders) {
  return client(format("http://localhost:%s", conf.REALTIME_PORT), {
    forceNew: true,
    extraHeaders
  });
};
