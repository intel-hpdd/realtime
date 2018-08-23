//
// Copyright (c) 2018 DDN. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

"use strict";

const λ = require("highland");
const obj = require("intel-obj");
const apiRequest = require("./api-request");

module.exports = function pollingRequest(path, options) {
  let ifNoneMatch = 0;

  return λ(function generator(push, next) {
    const withHeader = obj.merge(
      {},
      {
        headers: {
          "If-None-Match": ifNoneMatch
        }
      },
      options
    );

    const r = apiRequest(path, withHeader);

    const stream = this;
    stream._destructors.push(r.abort);

    r.filter(function remove304s(x) {
      if (x.statusCode !== 304) {
        ifNoneMatch = x.headers.etag;
        return true;
      }

      next();
    })
      .errors(function pushErr(err) {
        push(err);
        next();
      })
      .each(function pushData(x) {
        push(null, x);
        next();
      })
      .done(function removeAbort() {
        const idx = stream._destructors.indexOf(r.abort);

        if (idx !== -1) stream._destructors.splice(idx, 1);
      });
  });
};
