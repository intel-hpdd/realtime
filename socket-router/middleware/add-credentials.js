//
// Copyright (c) 2018 DDN. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

"use strict";

const obj = require("intel-obj");
const conf = require("../../conf");

module.exports = function addCredentials(req, resp, next) {
  const headers = {};
  const requestHeaders = resp.socket.request.headers;

  headers["User-Agent"] = requestHeaders["user-agent"];
  headers["Authorization"] = `ApiKey ${conf.API_USER}:${conf.API_KEY}`;

  const data = obj.merge(
    {},
    {
      headers
    },
    req.data
  );

  next(req, resp, data);
};
