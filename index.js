//
// Copyright (c) 2018 DDN. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

"use strict";

const createIo = require("socket.io");
const socketRouter = require("./socket-router");
const requestValidator = require("./request-validator");
const serializeError = require("./serialize-error");
const eventWildcard = require("./event-wildcard");
const conf = require("./conf");
const obj = require("intel-obj");
const fp = require("intel-fp/dist/fp");
const { query } = require("./db-utils");
const highland = require("highland");
const jpickle = require("jpickle");

// Don't limit to pool to 5 in node 0.10.x
const https = require("https");
const http = require("http");
https.globalAgent.maxSockets = http.globalAgent.maxSockets = Infinity;

const qs = require("querystring");
const url = require("url");

process.on("unhandledRejection", error => {
  console.error(error);
  process.exit(1);
});

const regexp = /sessionid=([^;|$]+)/;
const io = createIo();

io.use(eventWildcard);
io.use(function(socket, next) {
  const sessionKey = socket.request.headers.cookie.match(regexp)[1];

  highland(query("SELECT session_data FROM django_session WHERE session_key = $1;", [sessionKey]))
    .map(x => x.rows[0].session_data)
    .map(fp.flip(2, fp.curry(2, Buffer.from))("base64"))
    .map(x => x.toString("binary"))
    .map(x => x.split(":")[1])
    .map(jpickle.loads)
    .flatMap(({ _auth_user_id: authUserId }) => highland(query("SELECT * FROM auth_user WHERE id = $1", [authUserId])))
    .filter(({ rows: { length: rowCount } }) => {
      if (rowCount === 0) {
        if (conf.ALLOW_ANONYMOUS_READ) next();
        else next(new Error("ALLOW ANONYMOUS READ must be true for anonymous connections"));
        return false;
      } else {
        return true;
      }
    })
    .map(x => x.rows[0])
    .flatMap(x => {
      const s$ = highland(
        query(
          "SELECT agroup.name\
        FROM auth_user AS auser \
        INNER JOIN auth_user_groups AS ugroup ON auser.id = ugroup.user_id \
        INNER JOIN auth_group AS agroup ON ugroup.group_id = agroup.id \
        WHERE auser.id = $1;",
          [x.id]
        )
      )
        .map(x => x.rows)
        .map(fp.map(group => group.name))
        .map(groups => ({ groups }));

      return highland([highland([x]), s$]);
    })
    .sequence()
    .reduce1(obj.merge)
    .each(user => {
      socket.request.data = obj.merge({}, socket.request.data, {
        user
      });
      next();
    });
});

io.attach(conf.REALTIME_PORT, { wsEngine: "uws" });

const isMessage = /message(\d+)/;

io.on("connection", function(socket) {
  console.log(`socket connected: ${socket.id}`);
  let groups = [];
  if (socket.request.data != null) groups = socket.request.data.user.groups;

  socket.on("*", function onData(data, ack) {
    const matches = isMessage.exec(data.eventName);

    if (!matches) return;

    handleRequest(data, socket, ack, matches[1], groups);
  });

  socket.on("error", function onError(err) {
    console.error(`socket error: ${err}`);
  });
});

function handleRequest(data, socket, ack, id, groups) {
  try {
    const errors = requestValidator(data);

    if (errors.length) throw new Error(errors);

    const options = data.options || {};
    const method = typeof options.method !== "string" ? "get" : options.method;

    const parsedUrl = url.parse(data.path);
    const qsObj = { qs: qs.parse(parsedUrl.query) };

    socketRouter.go(
      parsedUrl.pathname,
      {
        verb: method,
        data: obj.merge({}, options, qsObj, { groups }),
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
    const err = serializeError(error);

    if (ack) ack(err);
    else socket.emit(data.eventName, err);
  }
}

const shutdown = () => {
  io.close();
};

module.exports = shutdown;
