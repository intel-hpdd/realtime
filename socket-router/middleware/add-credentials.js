//
// Copyright (c) 2018 DDN. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

'use strict';

var obj = require('intel-obj');

var regexp = /csrftoken=([^;|$]+)/;

module.exports = function addCredentials (req, resp, next) {
  var headers = {};
  var requestHeaders = resp.socket.request.headers;

  if (requestHeaders.cookie) {
    headers.Cookie = requestHeaders.cookie;

    var csrfTokenMatch = requestHeaders.cookie.match(regexp);
    if (csrfTokenMatch && csrfTokenMatch[1])
      headers['X-CSRFToken'] = csrfTokenMatch[1];
  }

  headers['User-Agent'] = requestHeaders['user-agent'];

  req.data = obj.merge({}, {
    headers: headers
  }, req.data);

  next(req, resp);
};
