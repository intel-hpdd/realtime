//
// Copyright (c) 2017 Intel Corporation. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

"use strict";

const obj = require("intel-obj");
let confJson = {};

if (process.env.NODE_ENV !== "test") confJson = require("./conf.json");

const defaults = {
  LOG_FILE: "realtime.log",
  NODE_ENV: process.env.NODE_ENV || "development",
  RUNNER: process.env.RUNNER
};

let conf = obj.merge({}, defaults, confJson);
if (conf.NODE_ENV === "test")
  conf = obj.merge({}, conf, {
    SERVER_HTTP_URL: "https://localhost:9200/",
    SOURCE_MAP_PATH: __dirname + "/test/integration/fixtures/built-fd5ce21b.js.map",
    REALTIME_PORT: 9201,
    LOG_PATH: __dirname
  });

module.exports = conf;
