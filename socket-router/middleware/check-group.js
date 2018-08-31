//
// Copyright (c) 2018 DDN. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

const fp = require("intel-fp/dist/fp");
const groupAllowed = require("../../group/group-allowed");
const groups = require("../../group/groups");
const conf = require("../../conf");
const serializeError = require("../../serialize-error");

const insufficientPermissionsError = serializeError(new Error("You do not have permissions to make this request."));

const allowGroup = groupName => fn => (req, res, data, next) => {
  if (groupAllowed(groupName, data.groups)) {
    fn(req, res, data, next);
  } else if (req.verb.toLowerCase() === "get" && conf.ALLOW_ANONYMOUS_READ === true) {
    fn(req, res, data, next);
  } else if (res.ack) {
    res.ack(insufficientPermissionsError);
  } else {
    res.socket.emit(insufficientPermissionsError);
    res.socket.disconnect(true);
  }
};

const transform = text =>
  text
    .toLowerCase()
    .split("_")
    .reduce((str, part) => (str += capitalize(part)));

const capitalize = x => x.charAt(0).toUpperCase() + x.slice(1);

const keys = [];
const vals = [];

Object.keys(groups).forEach(key => {
  keys.push(transform(key));
  vals.push(allowGroup(groups[key]));
});

module.exports = fp.zipObject(keys)(vals);
