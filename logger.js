//
// Copyright (c) 2018 DDN. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

"use strict";

const fp = require("intel-fp/dist/fp");

const info = (...args) => {
  console.info(...args);
};

const warn = (...args) => {
  console.warn(...args);
};

const error = (...args) => {
  console.error(...args);
};

const logSerializer = fp.curry(4, (serializerFn, logFn, serializableData, msg) => {
  logFn(serializerFn(serializableData), msg);
});

const socketSerializer = sock => {
  if (!sock) return false;

  return {
    id: sock.id
  };
};

const message = /message(\d+)/;
const reqSerializer = req => {
  if (!req) return false;

  return {
    path: (req.matches && req.matches[0]) || null,
    verb: req.verb,
    id: message.exec(req.messageName)[1],
    data: req.data
  };
};

const socketLogSerializer = logSerializer(socketSerializer);
const socketInfo = socketLogSerializer(info);
const socketWarn = socketLogSerializer(warn);
const socketError = socketLogSerializer(error);

const reqLogSerializer = logSerializer(reqSerializer);
const reqInfo = reqLogSerializer(info);
const reqWarn = reqLogSerializer(warn);
const reqError = reqLogSerializer(error);

module.exports = {
  socketInfo,
  socketWarn,
  socketError,
  reqInfo,
  reqWarn,
  reqError
};
