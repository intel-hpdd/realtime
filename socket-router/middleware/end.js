//
// Copyright (c) 2017 Intel Corporation. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

"use strict";

const logger = require("../../logger");

module.exports = function end(req, resp, stream, next) {
  resp.socket.once("disconnect", destroyStream);
  resp.socket.once(req.endName, destroyStream);

  function destroyStream() {
    if (!stream || stream._nil_seen || stream.ended) return;

    stream.destroy();
    stream = null;
    logger.info({ sock: resp.socket }, "stream ended");
  }

  next(req, resp);
};
