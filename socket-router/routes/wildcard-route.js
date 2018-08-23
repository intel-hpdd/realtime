//
// Copyright (c) 2018 DDN. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

"use strict";

const λ = require("highland");
const obj = require("intel-obj");
const fp = require("intel-fp/dist/fp");
const through = require("intel-through");
const apiRequest = require("../../api-request");
const pollingRequest = require("../../polling-request");
const socketRouter = require("../index");
const pushSerializeError = require("../../serialize-error/push-serialize-error");

module.exports = function wildcardRoute() {
  socketRouter.all("/:endpoint/:rest*", function genericHandler(req, resp, next) {
    const options = obj.merge({}, req.data, { method: req.verb.toUpperCase() });
    const requestToPath = apiRequest(req.matches[0]);
    const request = requestToPath.bind(null, options);
    let stream;

    const toPoll = ["host", "lnet_configuration", "alert", "command"];
    const paths = fp.zipObject(toPoll, toPoll);

    if (resp.ack) {
      stream = request();

      stream
        .pluck("body")
        .errors(pushSerializeError)
        .each(resp.ack.bind(resp.ack));
    } else if (req.matches[1] in paths) {
      stream = pollingRequest(req.matches[0], options);

      stream
        .pluck("body")
        .errors(pushSerializeError)
        .through(through.unchangedFilter)
        .each(resp.socket.emit.bind(resp.socket, req.messageName));
    } else {
      stream = λ(function generator(push, next) {
        request()
          .pluck("body")
          .errors(pushSerializeError)
          .each(function pushData(x) {
            push(null, x);
            next();
          });
      });

      stream
        .ratelimit(1, 1000)
        .through(through.unchangedFilter)
        .each(resp.socket.emit.bind(resp.socket, req.messageName));
    }

    next(req, resp, stream);
  });
};
