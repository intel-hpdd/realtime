//
// Copyright (c) 2018 DDN. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

"use strict";

var λ = require("highland");
var obj = require("intel-obj");
var fp = require("intel-fp/dist/fp");
var through = require("intel-through");
var apiRequest = require("../../api-request");
var pollingRequest = require("../../polling-request");
var socketRouter = require("../index");
var pushSerializeError = require("../../serialize-error/push-serialize-error");

module.exports = function wildcardRoute() {
  socketRouter.all("/:endpoint/:rest*", function genericHandler(req, resp, next) {
    var options = obj.merge({}, req.data, { method: req.verb.toUpperCase() });
    var requestToPath = apiRequest(req.matches[0]);
    var request = requestToPath.bind(null, options);
    var stream;

    var toPoll = ["host", "lnet_configuration", "alert", "command"];
    var paths = fp.zipObject(toPoll, toPoll);

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
