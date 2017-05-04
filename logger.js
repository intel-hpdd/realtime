// @flow

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

import conf from './conf';

import { default as logger, LEVELS, serializers } from '@mfl/logger';
import path from 'path';

const level = conf.NODE_ENV === 'production' ? LEVELS.ERROR : LEVELS.INFO;

export default logger({
  name: 'realtime',
  path: path.join(conf.LOG_PATH, conf.LOG_FILE),
  level: level,
  serializers: {
    err: serializers.err,
    sock: socketSerializer,
    sockReq: reqSerializer
  }
});

function socketSerializer(sock) {
  if (!sock) return false;

  return {
    id: sock.id
  };
}

const message = /message(\d+)/;

function reqSerializer(req) {
  if (!req) return false;

  return {
    path: (req.matches && req.matches[0]) || null,
    verb: req.verb,
    id: message.exec(req.messageName)[1],
    data: req.data
  };
}
