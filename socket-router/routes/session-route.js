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

'use strict';

const socketRouter = require('../index');
const obj = require('intel-obj');
const apiRequest = require('../../api-request');
const pushSerializeError = require('../../serialize-error/push-serialize-error');
const fp = require ('intel-fp/dist/fp');

module.exports = function sessionRoute () {
  socketRouter.post('/session', function postSessionRoute (req, resp, next) {
    var stream;

    stream = processSession(getRequest(req), resp);
    next(req, resp, stream);
  });

  socketRouter.delete('/session', function deleteSessionRoute (req, resp, next) {
    var stream;

    stream = processSession(getRequest(req), resp);
    next(req, resp, stream);
  });

  function processSession (request, resp) {
    const regexp = /sessionid=([^;|$]+)/;
    const headers = resp.socket.request.headers;

    return request()
     .map(x => x.headers['set-cookie'])
     .map(fp.find(x => x.match(regexp)))
     .tap(
       fp.flow(
         x => x.split('; ')[0],
         x => headers.cookie = headers.cookie.replace(regexp, () => `${x}`)
       )
     )
     .errors(pushSerializeError)
     .each(resp.ack.bind(resp.ack));
  }

  function getRequest (req) {
    var options = obj.merge({}, req.data, {
      method: req.verb.toUpperCase()
    });
    var requestToPath = apiRequest(req.matches[0]);
    return requestToPath.bind(null, options);
  }
};
