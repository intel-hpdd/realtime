//
// Copyright (c) 2017 Intel Corporation. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

'use strict';

var apiRequest = require('../api-request');
var pollingRequest = require('../polling-request');
var fp = require('intel-fp/dist/fp');
var obj = require('intel-obj');

var objectsLens = fp.pathLens(['body', 'objects']);

exports.waitForCommands = fp.curry(2, function waitForCommands (headers, ids) {
  var pickValues = fp.flow(
    obj.pick.bind(null, ['cancelled', 'complete', 'errored']),
    obj.values
  );

  var commandsFinished = fp.flow(
    fp.map(pickValues),
    fp.map(fp.some(fp.identity)),
    fp.every(fp.identity)
  );

  var s = pollingRequest('/command', {
    headers: headers,
    qs: {
      id__in: ids,
      limit: 0
    }
  });

  return s
    .map(objectsLens)
    .filter(commandsFinished)
    .tap(function destroyOnCompletion () {
      process.nextTick(s.destroy.bind(s));
    });
});

var jobRegexp = /^\/api\/job\/(\d+)\/$/;

var getJobIds = fp.flow(
  fp.map(fp.lensProp('jobs')),
  fp.unwrap,
  fp.map(fp.invokeMethod('match', [jobRegexp])),
  fp.map(fp.lensProp('1'))
);

exports.getSteps = fp.curry(2, function getSteps (headers, s) {
  return s
    .map(getJobIds)
    .flatMap(function getJobs (ids) {
      return apiRequest('/job', {
        headers: headers,
        qs: {
          id__in: ids,
          limit: 0
        },
        jsonMask: 'objects(step_results,steps)'
      });
    })
    .map(objectsLens)
    .map(fp.map(function getSteps (job) {
      return job.step_results[job.steps[0]];
    }));
});
