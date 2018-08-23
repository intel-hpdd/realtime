//
// Copyright (c) 2018 DDN. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

"use strict";

const emit = require("events").EventEmitter.prototype.emit;
const obj = require("intel-obj");

module.exports = function eventWildcard(socket, next) {
  if (socket.onevent !== onEvent) socket.onevent = onEvent;

  return next();
};

function onEvent(packet) {
  const args = packet.data || [];

  if (packet.id != null) args.push(this.ack(packet.id));

  emit.apply(this, args);

  const wildcardArgs = [...args];

  const eventName = wildcardArgs.splice(0, 1, "*");

  wildcardArgs[1] = obj.clone(wildcardArgs[1] || {});

  wildcardArgs[1].eventName = eventName[0];

  emit.apply(this, wildcardArgs);
}
