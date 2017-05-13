// @flow

//
// INTEL CONFIDENTIAL
//
// Copyright 2013-2017 Intel Corporation All Rights Reserved.
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

import confJsonImport from './conf.json';

type DefaultConfig = {
  LOG_FILE: string,
  NODE_ENV: 'test' | 'production'
};

type Conf = {
  SERVER_HTTP_URL: string,
  SOURCE_MAP_PATH: string,
  REALTIME_PORT: number,
  LOG_PATH: string
};

let confJson = {};

if (process.env.NODE_ENV !== 'test') confJson = confJsonImport;

let nodeEnvironment = process.env.NODE_ENV;
if (nodeEnvironment !== 'test' && nodeEnvironment !== 'production')
  nodeEnvironment = 'test';

const defaults: DefaultConfig = {
  LOG_FILE: 'realtime.log',
  NODE_ENV: nodeEnvironment
};

if (Object.keys(confJson).length === 0 || nodeEnvironment === 'test')
  confJson = {
    SERVER_HTTP_URL: 'https://localhost:9200/',
    SOURCE_MAP_PATH: __dirname +
      '/test/integration/fixtures/built-fd5ce21b.js.map',
    REALTIME_PORT: 9201,
    LOG_PATH: __dirname
  };

const conf: Conf = {
  ...defaults,
  ...confJson
};

export default conf;
