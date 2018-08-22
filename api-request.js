//
// Copyright (c) 2018 DDN. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

"use strict";

var conf = require("./conf");
var url = require("url");
var obj = require("intel-obj");
var fp = require("intel-fp/dist/fp");
var getReq = require("intel-req");
var format = require("util").format;

var serverHttpUrl = url.parse(conf.SERVER_HTTP_URL);
var hostOptions = {
  localhost: serverHttpUrl.href,
  host: serverHttpUrl.host,
  hostname: serverHttpUrl.hostname,
  port: serverHttpUrl.port
};

var apiFormat = format.bind(format, "/api%s");

var req = getReq();

module.exports = fp.curry(2, function apiRequest(path, options) {
  path = path.replace(/^\/*/, "/").replace(/\/*$/, "/");

  var opts = obj.merge({}, options, hostOptions);
  opts.path = apiFormat(path);

  return req.bufferRequest(opts);
});

module.exports.waitForRequests = req.waitForRequests;
