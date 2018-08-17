// Copyright (c) 2018 Intel Corporation. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

const { Pool } = require("pg");
const conf = require("./conf.js");
const highland = require("highland");
const broadcaster = require("./broadcaster");

const pool = new Pool({ user: conf.DB_USER, password: conf.DB_PASSWORD, database: conf.DB_NAME, host: conf.DB_HOST });
pool.on("error", e => {
  console.error("Connection pool encountered an error", e.stack);
  pool.end().then(() => process.exit(-1));
});

exports.pool = pool;

const stream = highland((push, _) => {
  pool.connect().then(c => {
    c.on("notification", x => push(null, x));
    c.on("notice", msg => console.warn("notice: ", msg));
    c.on("error", e => {
      console.error("Error listening for table_update", e.stack);
      c.release();
      setImmediate(() => {
        throw e;
      });
    });
    c.query("LISTEN table_update");
  });
});

exports.viewer = broadcaster(stream);
