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

import * as fp from '@mfl/fp';

import through from '@mfl/through';
import pollingRequest from '../../polling-request';
import socketRouter from '../index';
import pushSerializeError from '../../serialize-error/push-serialize-error';

var STATES;

export const STATES = (STATES = {
  ERROR: 'ERROR',
  WARN: 'WARNING',
  GOOD: 'GOOD'
});

export default function healthRoutes() {
  socketRouter.get('/health', function healthRoute(req, resp, next) {
    const stream = pollingRequest('/alert', {
      headers: req.data.headers,
      qs: {
        active: true,
        severity__in: [STATES.WARN, STATES.ERROR],
        limit: 0
      }
    });

    const getHealth = fp.flow(
      unique,
      fp.invokeMethod('sort', [compare]),
      fp.tail
    );

    const buildOutput = fp.flow(
      fp.pathLens(['body', 'objects']),
      fp.map(fp.lensProp('severity')),
      fp.filter(fp.identity),
      fp.arrayWrap,
      fp.mapFn([getHealth, fp.lensProp('length')]),
      fp.zipObject(['health', 'count'])
    );

    fp
      .map(buildOutput, stream)
      .errors(pushSerializeError)
      .through(through.unchangedFilter)
      .each(resp.socket.emit.bind(resp.socket, req.messageName));

    function unique(xs) {
      return xs.reduce(
        function reducer(a, b) {
          if (a.indexOf(b) < 0) a.push(b);

          return a;
        },
        [STATES.GOOD]
      );
    }

    function compare(a, b) {
      const states = [STATES.GOOD, STATES.WARN, STATES.ERROR];

      return states.indexOf(a) - states.indexOf(b);
    }

    next(req, resp, stream);
  });
}
