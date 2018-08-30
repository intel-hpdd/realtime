//
// Copyright (c) 2018 DDN. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

"use strict";

const socketRouter = require("../index");
const apiRequest = require("../../api-request");

module.exports = () => {
  const getSessionRoute = (req, resp, data, next) => {
    const stream = apiRequest("/session", { method: "get", headers: resp.socket.request.headers })
      .map(x => x.body)
      .each(resp.socket.emit.bind(resp.socket, req.messageName));

    next(req, resp, stream);
  };

  socketRouter.route("/session").get(getSessionRoute);
};
