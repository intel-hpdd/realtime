//
// Copyright (c) 2017 Intel Corporation. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

"use strict";

const Validator = require("jsonschema").Validator;
const validator = new Validator();

const schema = {
  id: "/RequestData",
  type: "object",
  required: true,
  properties: {
    path: {
      type: "string",
      required: true
    },
    options: {
      type: "object",
      properties: {
        method: {
          enum: ["get", "post", "put", "patch", "delete"]
        }
      }
    }
  }
};

module.exports = function getErrorList(data) {
  return validator.validate(data, schema).errors.reduce(function joinErrors(message, error) {
    return message + error.stack + "\n";
  }, "");
};
