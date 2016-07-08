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

var conf = require('./conf');
var url = require('url');
var obj = require('intel-obj');
var fp = require('intel-fp/dist/fp');
var getReq = require('intel-req');
var format = require('util').format;

var serverHttpUrl = url.parse(conf.SERVER_HTTP_URL);
var hostOptions = {
  localhost: serverHttpUrl.href,
  host: serverHttpUrl.host,
  hostname: serverHttpUrl.hostname,
  port: serverHttpUrl.port
};

var apiFormat = format.bind(format, '/api%s');

var req = getReq();

module.exports = fp.curry(2, function apiRequest (path, options) {
  path = path
    .replace(/^\/*/, '/')
    .replace(/\/*$/, '/');

  var opts = obj.merge({}, options, hostOptions);
  opts.path = apiFormat(path);

  return req.bufferRequest(opts);
});

module.exports.waitForRequests = req.waitForRequests;
