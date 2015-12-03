//
// INTEL CONFIDENTIAL
//
// Copyright 2013-2015 Intel Corporation All Rights Reserved.
//
// The source code contained or described herein and all documents related
// to the source code ("Material") are owned by Intel Corporation or its
// suppliers or licensors. Title to the Material remains with Intel Corporation
// or its suppliers and licensors. The Material contains trade secrets and
// proprietary and confidential information of Intel or its suppliers and
// licensors. The Material is protected by worldwide copyright and trade secret
// laws and treaty provisions. No part of the Material may be used, copied,
// reproduced, modified, published, uploaded, posted, transmitted, distributed,
// or disclosed in any way without Intel's prior express written permission.
//
// No license under any patent, copyright, trade secret or other intellectual
// property right is granted to or conferred upon you by disclosure or delivery
// of the Materials, either expressly, by implication, inducement, estoppel or
// otherwise. Any license under such intellectual property rights must be
// express and approved by Intel in writing.

'use strict';

var apiRequest = require('../api-request');
var pollingRequest = require('../polling-request');
var fp = require('intel-fp');
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
