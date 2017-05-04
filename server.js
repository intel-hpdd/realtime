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

import start from './index';
import logger from './logger';
import * as fp from '@mfl/fp';

let tryLogging = fp.curry(2, function tryLogging(level, msg) {
  try {
    logger[level].apply(logger, msg);
  } catch (e) {
    console.log.apply(console, msg);
  }
});

if (conf.RUNNER === 'supervisor') {
  process.on('SIGINT', cleanShutdown('SIGINT (Ctrl-C)'));
  process.on('SIGTERM', cleanShutdown('SIGTERM'));
}

function cleanShutdown(signal) {
  return function cleanShutdownInner() {
    tryLogging('info', [{}, 'Caught ' + signal + ', shutting down cleanly.']);
    // Exit with 0 to keep supervisor happy.
    process.exit(0);
  };
}

process.on('uncaughtException', function(err) {
  tryLogging('error', [{ err: err }, 'unhandledException']);
  process.exit(1);
});

start();
