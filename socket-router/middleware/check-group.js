// @flow

//
// Copyright (c) 2017 Intel Corporation. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

const fp = require("intel-fp/dist/fp");
const groupAllowed = require("../../group/group-allowed");
const groups = require("../../group/groups");

const allowGroup = groupName => fn => (req, res, data, next) => {
  data.groupAllowed = false;
  if (groupAllowed(groupName, data.groups)) fn(req, res, data, next);
  else next(req, res, null);
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
