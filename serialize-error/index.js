//
// Copyright (c) 2017 Intel Corporation. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

"use strict";

const errorSerializer = require("intel-logger").serializers.err;
/**
 * Returns a normalized error
 * object for consumption
 * by a socket
 * @param {Error} error
 * @returns {Object}
 */
module.exports = function serializeError(error) {
  if (!error.statusCode) error.statusCode = 500;

  const serialized = errorSerializer(error);
  serialized.statusCode = error.statusCode;

  return { error: serialized };
};
