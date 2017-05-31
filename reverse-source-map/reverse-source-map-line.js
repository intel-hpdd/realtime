//
// Copyright (c) 2017 Intel Corporation. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

'use strict';

var λ = require('highland');
var reverser = require('./reverser');

var trace = λ(process.stdin)
  .otherwise(λ(['']));

trace
  .through(reverser)
  .pipe(process.stdout);
