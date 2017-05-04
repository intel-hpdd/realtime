//
// INTEL CONFIDENTIAL
//
// Copyright 2013-2016 Intel Corporation All Rights Reserved.
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

import apiRequest from '../api-request';

import pollingRequest from '../polling-request';
import * as fp from '@mfl/fp';
import * as obj from '@mfl/obj';

let objectsLens = fp.pathLens(['body', 'objects']);

export const waitForCommands = fp.curry(2, function waitForCommands(headers, ids) {
  let pickValues = fp.flow(
    obj.pick.bind(null, ['cancelled', 'complete', 'errored']),
    obj.values
  );

  let commandsFinished = fp.flow(
    fp.map(pickValues),
    fp.map(fp.some(fp.identity)),
    fp.every(fp.identity)
  );

  let s = pollingRequest('/command', {
    headers: headers,
    qs: {
      id__in: ids,
      limit: 0
    }
  });

  return s
    .map(objectsLens)
    .filter(commandsFinished)
    .tap(function destroyOnCompletion() {
      process.nextTick(s.destroy.bind(s));
    });
});

let jobRegexp = /^\/api\/job\/(\d+)\/$/;

let getJobIds = fp.flow(
  fp.map(fp.lensProp('jobs')),
  fp.unwrap,
  fp.map(fp.invokeMethod('match', [jobRegexp])),
  fp.map(fp.lensProp('1'))
);

export const getSteps = fp.curry(2, function getSteps(headers, s) {
  return s
    .map(getJobIds)
    .flatMap(function getJobs(ids) {
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
    .map(
      fp.map(function getSteps(job) {
        return job.step_results[job.steps[0]];
      })
    );
});
