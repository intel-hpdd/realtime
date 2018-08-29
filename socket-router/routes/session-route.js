//
// Copyright (c) 2018 DDN. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

"use strict";

const socketRouter = require("../index");
const apiRequest = require("../../api-request");
const pushSerializeError = require("../../serialize-error/push-serialize-error");
const fp = require("intel-fp/dist/fp");

module.exports = () => {
  const sessionRoute = (req, resp, data, next) => {
    const stream = processSession(apiRequest("/session", data), resp);
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

  const getSessionRoute = (req, resp, data, next) => {
    const stream = apiRequest("/session", { method: "get", headers: resp.socket.request.headers })
      .map(x => x.body)
      .each(resp.socket.emit.bind(resp.socket, req.messageName));

    next(req, resp, stream);
  };

  socketRouter
    .route("/session")
    .get(getSessionRoute)
    .post(sessionRoute)
    .delete(sessionRoute);
};
