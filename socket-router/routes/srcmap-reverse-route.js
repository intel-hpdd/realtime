//
// Copyright (c) 2017 Intel Corporation. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

'use strict';

var fp = require('intel-fp/dist/fp');
var apiRequest = require('../../api-request');
var socketRouter = require('../index');
var pushSerializeError = require('../../serialize-error/push-serialize-error');
var reverseSourceMap = require('../../reverse-source-map');
var logger = require('../../logger');

module.exports = function srcmapReverseRoute () {
  socketRouter.post('/srcmap-reverse', function srcmapReverseHandler (req, resp, next) {
    var reversedStream = reverseSourceMap(req.data.stack);

    reversedStream
      .observe()
      .map(function recordToApi (stack) {
        var headers = req.data.headers;
        delete req.data.headers;

        req.data.stack = stack;

        return {
          method: 'POST',
          json: req.data,
          headers: headers
        };
      })
      .flatMap(apiRequest('/client_error'))
      .stopOnError(function (err) {
        logger.error({ err: err });
      })
      .each(fp.noop);

    reversedStream
      .map(function setData (stack) {
        return { data: stack };
      })
      .stopOnError(pushSerializeError)
      .each(resp.ack.bind(resp));

    next(req, resp, reversedStream);
  });
};
