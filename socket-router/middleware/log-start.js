//
// Copyright (c) 2018 DDN. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

"use strict";

var logger = require("../../logger");

module.exports = function logStart(req, resp, next) {
  logger.info({ sock: resp.socket }, "routing request");

  next(req, resp);
};
