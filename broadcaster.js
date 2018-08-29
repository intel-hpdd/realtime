// Copyright (c) 2018 DDN. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

const highland = require("highland");

module.exports = function broadcaster(source$) {
  let latest;

  const viewers = [];

  source$
    .errors(error => {
      const err = {
        __HighlandStreamError__: true,
        error
      };

      viewers.forEach(v => v.write(err));
    })
    .each(xs => {
      latest = xs;
      viewers.forEach(v => v.write(xs));
    });

  const fn = () => {
    const viewer$ = highland().onDestroy(() => {
      const idx = viewers.indexOf(viewer$);

      if (idx !== -1) viewers.splice(idx, 1);
    });

    if (latest) viewer$.write(latest);

    viewers.push(viewer$);

    return viewer$;
  };

  fn.endBroadcast = () => source$.destroy();

  return fn;
};
