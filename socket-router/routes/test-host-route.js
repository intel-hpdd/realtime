//
// Copyright (c) 2018 DDN. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

"use strict";

const λ = require("highland");
const through = require("intel-through");
const apiRequest = require("../../api-request");
const socketRouter = require("../index");
const pushSerializeError = require("../../serialize-error/push-serialize-error");
const commandUtils = require("../command-utils");
const fp = require("intel-fp/dist/fp");

module.exports = function testHostRoute() {
  socketRouter.post("/test_host", function getStatus(req, resp, next) {
    const removeUndefined = fp.filter(
      fp.flow(
        fp.eq(undefined),
        fp.not
      )
    );
    const pullIds = fp.flow(
      fp.pathLens(["body", "objects"]),
      fp.map(fp.pathLens(["command", "id"])),
      removeUndefined
    );

    const stream = λ(function generator(push, next) {
      apiRequest("/test_host", req.data)
        .map(pullIds)
        .filter(fp.lensProp("length"))
        .flatMap(commandUtils.waitForCommands(req.data.headers))
        .through(commandUtils.getSteps(req.data.headers))
        .errors(pushSerializeError)
        .pull(function pullResponse(err, x) {
          if (err) push(err);
          else if (x === λ.nil) push(null, null);
          else push(null, x);

          next();
        });
    });

    stream
      .ratelimit(1, 1000)
      .compact()
      .through(through.unchangedFilter)
      .each(resp.socket.emit.bind(resp.socket, req.messageName));

    next(req, resp, stream);
  });
};
