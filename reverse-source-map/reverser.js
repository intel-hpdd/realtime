//
// Copyright (c) 2017 Intel Corporation. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

'use strict';

var conf = require('../conf');
var bufferString = require('intel-through').bufferString;
var createReadStream = require('fs').createReadStream;
var srcmapReverse = require('intel-srcmap-reverse').default;
var λ = require('highland');
var fp = require('intel-fp/dist/fp');

module.exports = function reverser (s) {
  var sourceMapStream = λ(createReadStream(conf.SOURCE_MAP_PATH));

  return λ([sourceMapStream, s])
    .flatMap(bufferString)
    .collect()
    .map(fp.invoke(srcmapReverse));
};
