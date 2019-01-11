//
// Copyright (c) 2017 Intel Corporation. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

"use strict";

const obj = require("intel-obj");

const regexp = /csrftoken=([^;|$]+)/;

module.exports = function addCredentials(req, resp, next) {
  const headers = {};
  const requestHeaders = resp.socket.request.headers;

  if (requestHeaders.cookie) {
    headers.Cookie = requestHeaders.cookie;

    const csrfTokenMatch = requestHeaders.cookie.match(regexp);
    if (csrfTokenMatch && csrfTokenMatch[1]) headers["X-CSRFToken"] = csrfTokenMatch[1];
  }

  headers["User-Agent"] = requestHeaders["user-agent"];

  req.data = obj.merge(
    {},
    {
      headers: headers
    },
    req.data
  );

  next(req, resp);
};
