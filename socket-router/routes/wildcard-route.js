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
var obj = require('intel-obj');
var fp = require('intel-fp/dist/fp');
var through = require('intel-through');
var apiRequest = require('../../api-request');
var pollingRequest = require('../../polling-request');
var socketRouter = require('../index');
var pushSerializeError = require('../../serialize-error/push-serialize-error');

module.exports = function wildcardRoute () {
  socketRouter.all('/:endpoint/:rest*', function genericHandler (req, resp, next) {
    var options = obj.merge({}, req.data, { method: req.verb.toUpperCase() });
    var requestToPath = apiRequest(req.matches[0]);
    var request = requestToPath.bind(null, options);
    var stream;

    var toPoll = ['host', 'lnet_configuration', 'alert', 'command'];
    var paths = fp.zipObject(toPoll, toPoll);

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
      stream = λ(function generator (push, next) {
        request()
          .pluck('body')
          .errors(pushSerializeError)
          .each(function pushData (x) {
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
};
