//
// Copyright (c) 2018 DDN. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

"use strict";

const highland = require("highland");
const obj = require("intel-obj");
const through = require("intel-through");
const apiRequest = require("../../api-request");
const socketRouter = require("../index");
const pushSerializeError = require("../../serialize-error/push-serialize-error");
const checkGroup = require("../middleware/check-group");

module.exports = function wildcardRoute() {
  socketRouter.route("/:endpoint/:rest*").all(
    checkGroup.fsUsers((req, resp, data, next) => {
      const options = obj.merge({}, data, { method: req.verb.toUpperCase() });
      const requestToPath = apiRequest(req.matches[0]);
      const request = requestToPath.bind(null, options);
      let stream;

      if (resp.ack) {
        stream = request();

        stream
          .pluck("body")
          .errors(pushSerializeError)
          .each(resp.ack.bind(resp.ack));
      } else {
        stream = highland(function generator(push, next) {
          request()
            .pluck("body")
            .errors(pushSerializeError)
            .each(x => {
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
    })
  );
};
