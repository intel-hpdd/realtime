//
// Copyright (c) 2017 Intel Corporation. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

"use strict";

const fp = require("intel-fp/dist/fp");
const through = require("intel-through");
const pollingRequest = require("../../polling-request");
const socketRouter = require("../index");
const pushSerializeError = require("../../serialize-error/push-serialize-error");

let STATES;
exports.STATES = STATES = {
  ERROR: "ERROR",
  WARN: "WARNING",
  GOOD: "GOOD"
};

module.exports = function healthRoutes() {
  socketRouter.get("/health", function healthRoute(req, resp, next) {
    const stream = pollingRequest("/alert", {
      headers: req.data.headers,
      qs: {
        active: true,
        severity__in: [STATES.WARN, STATES.ERROR],
        limit: 0
      }
    });

    const getHealth = fp.flow(
      unique,
      fp.invokeMethod("sort", [compare]),
      fp.tail
    );

    const buildOutput = fp.flow(
      fp.pathLens(["body", "objects"]),
      fp.map(fp.lensProp("severity")),
      fp.filter(fp.identity),
      fp.arrayWrap,
      fp.mapFn([getHealth, fp.lensProp("length")]),
      fp.zipObject(["health", "count"])
    );

    fp.map(buildOutput, stream)
      .errors(pushSerializeError)
      .through(through.unchangedFilter)
      .each(resp.socket.emit.bind(resp.socket, req.messageName));

    function unique(xs) {
      return xs.reduce(
        function reducer(a, b) {
          if (a.indexOf(b) < 0) a.push(b);

          return a;
        },
        [STATES.GOOD]
      );
    }

    function compare(a, b) {
      const states = [STATES.GOOD, STATES.WARN, STATES.ERROR];

      return states.indexOf(a) - states.indexOf(b);
    }

    next(req, resp, stream);
  });
};
