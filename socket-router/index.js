//
// Copyright (c) 2018 DDN. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

"use strict";

const getRouter = require("@iml/router").default;
const addCredentials = require("./middleware/add-credentials");
const end = require("./middleware/end");

module.exports = getRouter()
  .addStart(addCredentials)
  .addEnd(end);

const addRoutes = require("./add-routes");
addRoutes();
