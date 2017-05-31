//
// Copyright (c) 2017 Intel Corporation. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

'use strict';

var λ = require('highland');
var fp = require('intel-fp/dist/fp');
var exec = require('child_process').exec;
var format = require('util').format;
var bufferString = require('intel-through').bufferString;
var logger = require('./../logger');

module.exports = function reverseSourceMap (trace) {
  var lines = trace.split('\n');
  var logError = fp.curry(2, logger.error.bind(logger))(fp.__, 'Reversing source map');
  var logErrorOnce = fp.once(logError);

  return λ(lines)
    .map(function (line) {
      return λ(function generator (push) {
        var reverse = exec(format('node %s/reverse-source-map-line.js', __dirname), function (err, x) {
          if (err) {
            logErrorOnce({ err: err });
            push(null, line + '\n');
          } else {
            push(null, x + '\n');
          }

          push(null, λ.nil);
        });

        reverse.stdin.write(line);
        reverse.stdin.end();
      });
    })
    .parallel(lines.length)
    .through(bufferString);
};
