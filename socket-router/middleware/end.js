//
// Copyright (c) 2018 DDN. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

"use strict";

module.exports = function end(req, resp, stream, next) {
  resp.socket.once("disconnect", destroyStream);
  resp.socket.once(req.endName, destroyStream);

  function destroyStream() {
    if (!stream || stream._nil_seen || stream.ended) return;

    if (stream.endBroadcast) stream.endBroadcast();
    else stream.destroy();

    stream = null;
    console.info(`stream ended: ${resp.socket.id}`);
  }

  next(req, resp);
};
