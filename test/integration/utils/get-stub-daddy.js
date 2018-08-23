"use strict";

const getStubDaddy = require("@iml/stub-daddy").default;
const conf = require("../../../conf");
const url = require("url");

module.exports = function invokeStubDaddy() {
  const stubDaddy = getStubDaddy({ port: url.parse(conf.SERVER_HTTP_URL).port });

  return stubDaddy;
};
