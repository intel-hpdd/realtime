//
// Copyright (c) 2018 DDN. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

"use strict";

const conf = require("./conf");
const url = require("url");
const obj = require("intel-obj");
const fp = require("intel-fp/dist/fp");
const getReq = require("intel-req");
const format = require("util").format;

const serverHttpUrl = url.parse(conf.SERVER_HTTP_URL);
const hostOptions = {
  localhost: serverHttpUrl.href,
  host: serverHttpUrl.host,
  hostname: serverHttpUrl.hostname,
  port: serverHttpUrl.port
};

const apiFormat = format.bind(format, "/api%s");

const req = getReq();

module.exports = fp.curry(2, function apiRequest(path, options) {
  path = path.replace(/^\/*/, "/").replace(/\/*$/, "/");

  const opts = obj.merge({}, options, hostOptions);
  opts.path = apiFormat(path);

  return req.bufferRequest(opts);
});

module.exports.waitForRequests = req.waitForRequests;
