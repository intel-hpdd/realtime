//
// Copyright (c) 2017 Intel Corporation. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

'use strict';

var getRouter = require('intel-router').default;
var logStart = require('./middleware/log-start');
var addCredentials = require('./middleware/add-credentials');
var end = require('./middleware/end');

module.exports = getRouter()
  .addStart(logStart)
  .addStart(addCredentials)
  .addEnd(end);

var addRoutes = require('./add-routes');
addRoutes();
