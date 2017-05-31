//
// Copyright (c) 2017 Intel Corporation. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

'use strict';

var fp = require('intel-fp/dist/fp');
var through = require('intel-through');
var pollingRequest = require('../../polling-request');
var socketRouter = require('../index');
var pushSerializeError = require('../../serialize-error/push-serialize-error');

var STATES;
exports.STATES = STATES = {
  ERROR: 'ERROR',
  WARN: 'WARNING',
  GOOD: 'GOOD'
};

module.exports = function healthRoutes () {
  socketRouter.get('/health', function healthRoute (req, resp, next) {
    var stream = pollingRequest('/alert', {
      headers: req.data.headers,
      qs: {
        active: true,
        severity__in: [STATES.WARN, STATES.ERROR],
        limit: 0
      }
    });

    var getHealth = fp.flow(
      unique,
      fp.invokeMethod('sort', [compare]),
      fp.tail
    );

    var buildOutput = fp.flow(
      fp.pathLens(['body', 'objects']),
      fp.map(fp.lensProp('severity')),
      fp.filter(fp.identity),
      fp.arrayWrap,
      fp.mapFn([getHealth, fp.lensProp('length')]),
      fp.zipObject(['health', 'count'])
    );

    fp.map(buildOutput, stream)
      .errors(pushSerializeError)
      .through(through.unchangedFilter)
      .each(resp.socket.emit.bind(resp.socket, req.messageName));

    function unique (xs) {
      return xs.reduce(function reducer (a, b) {
        if (a.indexOf(b) < 0)
          a.push(b);

        return a;
      }, [STATES.GOOD]);
    }

    function compare (a, b) {
      var states = [STATES.GOOD, STATES.WARN, STATES.ERROR];

      return states.indexOf(a) - states.indexOf(b);
    }

    next(req, resp, stream);
  });
};
