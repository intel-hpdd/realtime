//
// Copyright (c) 2018 DDN. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

"use strict";

var conf = require("./conf");
var start = require("./index");
var logger = require("./logger");
var fp = require("intel-fp/dist/fp");

var tryLogging = fp.curry(2, function tryLogging(level, msg) {
  try {
    logger[level].apply(logger, msg);
  } catch (e) {
    console.log.apply(console, msg);
  }
});

if (conf.RUNNER === "supervisor") {
  process.on("SIGINT", cleanShutdown("SIGINT (Ctrl-C)"));
  process.on("SIGTERM", cleanShutdown("SIGTERM"));
}

function cleanShutdown(signal) {
  return function cleanShutdownInner() {
    tryLogging("info", [{}, "Caught " + signal + ", shutting down cleanly."]);
    // Exit with 0 to keep supervisor happy.
    process.exit(0);
  };
}

process.on("uncaughtException", function(err) {
  tryLogging("error", [{ err: err }, "unhandledException"]);
  process.exit(1);
});

start();
