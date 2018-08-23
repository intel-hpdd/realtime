//
// Copyright (c) 2018 DDN. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

"use strict";

var createIo = require("socket.io");
var socketRouter = require("./socket-router");
var requestValidator = require("./request-validator");
var serializeError = require("./serialize-error");
var eventWildcard = require("./event-wildcard");
var conf = require("./conf");
var obj = require("intel-obj");

// Don't limit to pool to 5 in node 0.10.x
var https = require("https");
var http = require("http");
https.globalAgent.maxSockets = http.globalAgent.maxSockets = Infinity;

var qs = require("querystring");
var url = require("url");

var io = createIo();
io.use(eventWildcard);
io.attach(conf.REALTIME_PORT, { wsEngine: "uws" });

var isMessage = /message(\d+)/;

io.on("connection", function(socket) {
  console.log(`socket connected: ${socket.id}`);

  socket.on("*", function onData(data, ack) {
    var matches = isMessage.exec(data.eventName);

    if (!matches) return;

    handleRequest(data, socket, ack, matches[1]);
  });

  socket.on("error", function onError(err) {
    console.error(`socket error: ${err}`);
  });
});

function handleRequest(data, socket, ack, id) {
  try {
    var errors = requestValidator(data);

    if (errors.length) throw new Error(errors);

    var options = data.options || {};
    var method = typeof options.method !== "string" ? "get" : options.method;

    var parsedUrl = url.parse(data.path);
    var qsObj = { qs: qs.parse(parsedUrl.query) };

    socketRouter.go(
      parsedUrl.pathname,
      {
        verb: method,
        data: obj.merge({}, options, qsObj),
        messageName: data.eventName,
        endName: "end" + id
      },
      {
        socket: socket,
        ack: ack
      }
    );
  } catch (error) {
    error.statusCode = 400;
    var err = serializeError(error);

    if (ack) ack(err);
    else socket.emit(data.eventName, err);
  }
}

return function shutdown() {
  io.close();
};
