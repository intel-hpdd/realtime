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

var λ = require('highland');
var through = require('intel-through');
var apiRequest = require('../../api-request');
var socketRouter = require('../index');
var pushSerializeError = require('../../serialize-error/push-serialize-error');
var commandUtils = require('../command-utils');
var fp = require('intel-fp');

module.exports = function testHostRoute () {
  socketRouter.post('/test_host', function getStatus (req, resp, next) {
    var removeUndefined = fp.filter(fp.flow(fp.eq(undefined), fp.not));
    var pullIds = fp.flow(
      fp.pathLens(['body', 'objects']),
      fp.map(fp.pathLens(['command', 'id'])),
      removeUndefined
    );

    var stream = λ(function generator (push, next) {
      apiRequest('/test_host', req.data)
        .map(pullIds)
        .filter(fp.lensProp('length'))
        .flatMap(commandUtils.waitForCommands(req.data.headers))
        .through(commandUtils.getSteps(req.data.headers))
        .errors(pushSerializeError)
        .pull(function pullResponse (err, x) {
          if (err)
            push(err);
          else if (x === λ.nil)
            push(null, null);
          else
            push(null, x);

          next();
        });
    });

    stream
      .ratelimit(1, 1000)
      .compact()
      .through(through.unchangedFilter)
      .each(resp.socket.emit.bind(resp.socket, req.messageName));

    next(req, resp, stream);
  });
};
