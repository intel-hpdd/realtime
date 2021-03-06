//
// Copyright (c) 2018 DDN. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

"use strict";

const routes = require("./routes");
const fp = require("intel-fp/dist/fp");

module.exports = fp.once(function addRoutes() {
  routes.testHostRoute();
  routes.sessionRoute();
  //These should always be last.
  routes.wildcardRoute();
});
