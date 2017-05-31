//
// Copyright (c) 2017 Intel Corporation. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

'use strict';

var serializeError = require('./index');

module.exports = function pushSerializeError (err, push) {
  push(null, serializeError(err));
};
