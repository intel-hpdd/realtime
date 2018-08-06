// Copyright (c) 2018 DDN. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

"use strict";

var obj = require("intel-obj");
var confJson = {};

if (process.env.NODE_ENV !== "test")
  confJson = {
    LOG_PATH: process.env.LOG_PATH,
    REALTIME_PORT: process.env.REALTIME_PORT,
    SERVER_HTTP_URL: process.env.SERVER_HTTP_URL
  };

var defaults = {
  LOG_FILE: "realtime.log",
  NODE_ENV: process.env.NODE_ENV || "development",
  RUNNER: process.env.RUNNER
};

var conf = obj.merge({}, defaults, confJson);
if (conf.NODE_ENV === "test")
  conf = obj.merge({}, conf, {
    SERVER_HTTP_URL: "https://localhost:9200/",
    REALTIME_PORT: 9201,
    LOG_PATH: __dirname
  });

module.exports = conf;
