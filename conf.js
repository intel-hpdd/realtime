// Copyright (c) 2018 DDN. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

"use strict";

const obj = require("intel-obj");
let confJson = {};

if (process.env.NODE_ENV !== "test")
  confJson = {
    LOG_PATH: process.env.LOG_PATH,
    REALTIME_PORT: process.env.REALTIME_PORT,
    SERVER_HTTP_URL: process.env.SERVER_HTTP_URL,
    SOURCE_MAP_PATH: process.env.SOURCE_MAP_PATH,
    DB_HOST: process.env.DB_HOST,
    DB_NAME: process.env.DB_NAME,
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD,
    API_KEY: process.env.API_KEY,
    API_USER: process.env.API_USER,
    ALLOW_ANONYMOUS_READ: process.env.ALLOW_ANONYMOUS_READ === "true"
  };

if (confJson.DB_HOST === "") confJson.DB_HOST = "/var/run/postgresql";

const defaults = {
  LOG_PATH: "./",
  LOG_FILE: "realtime.log",
  NODE_ENV: process.env.NODE_ENV || "development",
  RUNNER: process.env.RUNNER
};

let conf = obj.merge({}, defaults, confJson);
if (conf.NODE_ENV === "test")
  conf = obj.merge({}, conf, {
    SERVER_HTTP_URL: "https://localhost:9200/",
    REALTIME_PORT: 9201,
    LOG_PATH: __dirname
  });

module.exports = conf;
