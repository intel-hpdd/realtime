//
// Copyright (c) 2018 DDN. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

"use strict";

const socketRouter = require("../index");
const apiRequest = require("../../api-request");
const pushSerializeError = require("../../serialize-error/push-serialize-error");
const fp = require("intel-fp/dist/fp");

module.exports = function sessionRoute() {
  const sessionRoute = (req, resp, next) => {
    const stream = processSession(apiRequest("/session", req.data), resp);

    next(req, resp, stream);
  };

  const processSession = (request, resp) => {
    const regexp = /sessionid=([^;|$]+)/;
    const headers = resp.socket.request.headers;

    return request
      .map(x => x.headers["set-cookie"])
      .map(fp.find(x => x.match(regexp)))
      .tap(
        fp.flow(
          x => x.split("; ")[0],
          x => (headers.cookie = headers.cookie.replace(regexp, () => `${x}`))
        )
      )
      .errors(pushSerializeError)
      .each(resp.ack.bind(resp.ack));
  };

  socketRouter.post("/session", sessionRoute);
  socketRouter.delete("/session", sessionRoute);
};
