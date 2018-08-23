//
// Copyright (c) 2018 DDN. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

"use strict";

module.exports = function logStart(req, resp, next) {
  console.log(`routing request: ${resp.socket.id}`);

  next(req, resp);
};
