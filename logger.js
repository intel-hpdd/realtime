//
// Copyright (c) 2017 Intel Corporation. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

"use strict";

const conf = require("./conf");
const logger = require("intel-logger");
const path = require("path");

const level = conf.NODE_ENV === "production" ? logger.LEVELS.ERROR : logger.LEVELS.INFO;

module.exports = logger.default({
  name: "realtime",
  path: path.join(conf.LOG_PATH, conf.LOG_FILE),
  level: level,
  serializers: {
    err: logger.serializers.err,
    sock: socketSerializer,
    sockReq: reqSerializer
  }
});

function socketSerializer(sock) {
  if (!sock) return false;

  return {
    id: sock.id
  };
}

const message = /message(\d+)/;

function reqSerializer(req) {
  if (!req) return false;

  return {
    path: (req.matches && req.matches[0]) || null,
    verb: req.verb,
    id: message.exec(req.messageName)[1],
    data: req.data
  };
}
