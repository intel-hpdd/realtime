//
// Copyright (c) 2018 DDN. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

"use strict";

const λ = require("highland");
const apiRequest = require("./api-request");

const wait = f => setTimeout(f, 1000);

module.exports = function pollingRequest(path, options) {
  return λ(function generator(push, next) {
    const r = apiRequest(path, options);

    const stream = this;
    stream._destructors.push(r.abort);

    r.pull((err, x) => {
      if (err) push(err);
      else push(null, x);

      const idx = stream._destructors.indexOf(r.abort);

      if (idx !== -1) stream._destructors.splice(idx, 1);

      wait(next);
    });
  });
};
