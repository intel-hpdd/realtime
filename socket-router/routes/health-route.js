//
// Copyright (c) 2018 DDN. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

"use strict";

const through = require("intel-through");
const socketRouter = require("../index");
const pushSerializeError = require("../../serialize-error/push-serialize-error");
const { viewer, query } = require("../../db-utils");
const highland = require("highland");
const broadcaster = require("../../broadcaster");

const getHealth = () =>
  query("select * from health_status()", x => ({
    health: x.health,
    count: x.num_alerts
  }));

const getHealth$ = broadcaster(
  highland([
    highland(getHealth()),
    viewer()
      .map(x => x.payload.split(","))
      .filter(xs => xs[1] === "chroma_core_alertstate")
      .flatMap(() => highland(getHealth()))
  ]).sequence()
);

module.exports = function healthRoutes() {
  socketRouter.get("/health", (req, resp, next) => {
    const stream = getHealth$();

    stream
      .errors(pushSerializeError)
      .through(through.unchangedFilter)
      .each(x => resp.socket.emit(req.messageName, x));

    next(req, resp, stream);
  });
};
