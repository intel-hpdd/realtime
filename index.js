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

import createIo from 'socket.io';

import socketRouter from './socket-router';
import requestValidator from './request-validator';
import serializeError from './serialize-error';
import eventWildcard from './event-wildcard';
import conf from './conf';
import logger from './logger';
import * as obj from '@mfl/obj';

// Don't limit to pool to 5 in node 0.10.x
import https from 'https';

import http from 'http';
https.globalAgent.maxSockets = http.globalAgent.maxSockets = Infinity;

import qs from 'querystring';
import url from 'url';

module.exports = function start() {
  let io = createIo();
  io.use(eventWildcard);
  io.attach(conf.REALTIME_PORT);

  let isMessage = /message(\d+)/;

  io.on('connection', function(socket) {
    let child = logger.child({ sock: socket });

    child.info('socket connected');

    socket.on('*', function onData(data, ack) {
      let matches = isMessage.exec(data.eventName);

      if (!matches) return;

      handleRequest(data, socket, ack, matches[1]);
    });

    socket.on('error', function onError(err) {
      child.error({ err: err }, 'socket error');
    });
  });

  function handleRequest(data, socket, ack, id) {
    try {
      let errors = requestValidator(data);

      if (errors.length) throw new Error(errors);

      let options = data.options || {};
      let method = typeof options.method !== 'string' ? 'get' : options.method;

      let parsedUrl = url.parse(data.path);
      let qsObj = { qs: qs.parse(parsedUrl.query) };

      socketRouter.go(
        parsedUrl.pathname,
        {
          verb: method,
          data: obj.merge({}, options, qsObj),
          messageName: data.eventName,
          endName: 'end' + id
        },
        {
          socket: socket,
          ack: ack
        }
      );
    } catch (error) {
      error.statusCode = 400;
      let err = serializeError(error);

      if (ack) ack(err);
      else socket.emit(data.eventName, err);
    }
  }

  return function shutdown() {
    io.close();
  };
};
