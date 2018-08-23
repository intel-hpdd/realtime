"use strict";
const client = require("socket.io-client");
const conf = require("../../../conf");
const format = require("util").format;

module.exports = function invokeSocket(extraHeaders) {
  return client(format("http://localhost:%s", conf.REALTIME_PORT), {
    forceNew: true,
    extraHeaders
  });
};
