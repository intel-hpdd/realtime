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

import λ from 'highland';

import * as obj from '@mfl/obj';
import * as fp from '@mfl/fp';
import through from '@mfl/through';
import apiRequest from '../../api-request';
import pollingRequest from '../../polling-request';
import socketRouter from '../index';
import pushSerializeError from '../../serialize-error/push-serialize-error';

export default function wildcardRoute() {
  socketRouter.all('/:endpoint/:rest*', function genericHandler(
    req,
    resp,
    next
  ) {
    const options = obj.merge({}, req.data, { method: req.verb.toUpperCase() });
    const requestToPath = apiRequest(req.matches[0]);
    const request = requestToPath.bind(null, options);
    let stream;

    const toPoll = ['host', 'lnet_configuration', 'alert', 'command'];
    const paths = fp.zipObject(toPoll, toPoll);

    if (resp.ack) {
      stream = request();

      stream
        .pluck('body')
        .errors(pushSerializeError)
        .each(resp.ack.bind(resp.ack));
    } else if (req.matches[1] in paths) {
      stream = pollingRequest(req.matches[0], options);

      stream
        .pluck('body')
        .errors(pushSerializeError)
        .through(through.unchangedFilter)
        .each(resp.socket.emit.bind(resp.socket, req.messageName));
    } else {
      stream = λ(function generator(push, next) {
        request()
          .pluck('body')
          .errors(pushSerializeError)
          .each(function pushData(x) {
            push(null, x);
            next();
          });
      });

      stream
        .ratelimit(1, 1000)
        .through(through.unchangedFilter)
        .each(resp.socket.emit.bind(resp.socket, req.messageName));
    }

    next(req, resp, stream);
  });
}
