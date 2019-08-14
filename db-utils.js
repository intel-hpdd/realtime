// Copyright (c) 2018 DDN. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

const { Pool } = require("pg");
const conf = require("./conf.js");

const pool = new Pool({
  user: conf.DB_USER,
  password: conf.DB_PASSWORD,
  database: conf.DB_NAME,
  host: conf.DB_HOST,
  connectionTimeoutMillis: 10000
});

exports.pool = pool;

const query = (...args) => pool.query(...args);

exports.query = query;
