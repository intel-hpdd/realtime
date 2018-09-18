// Copyright (c) 2018 DDN. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

const fp = require("intel-fp/dist/fp");
const { query } = require("../../db-utils");
const highland = require("highland");
const jpickle = require("jpickle");
const obj = require("intel-obj");

const regexp = /sessionid=([^;|$]+)/;

module.exports = (socket, next) => {
  const sessionKey = socket.request.headers.cookie.match(regexp)[1];

  highland(
    query("SELECT session_data FROM django_session WHERE session_key = $1 AND expire_date > NOW();", [sessionKey])
  )
    .filter(x => {
      if (x.rows.length > 0 && x.rows[0].session_data != null) return true;
      else next();
    })
    .map(x => x.rows[0].session_data)
    .map(x => Buffer.from(x, "base64"))
    .map(x => x.toString("binary"))
    .map(x => x.split(":")[1])
    .map(jpickle.loads)
    .flatMap(({ _auth_user_id: authUserId }) => highland(query("SELECT * FROM auth_user WHERE id = $1", [authUserId])))
    .filter(({ rows: { length: rowCount } }) => {
      if (rowCount > 0) return true;
      else next();
    })
    .map(x => x.rows[0])
    .flatMap(x => {
      const s$ = highland(
        query(
          "SELECT agroup.name \
FROM auth_user AS auser \
INNER JOIN auth_user_groups AS ugroup ON auser.id = ugroup.user_id \
INNER JOIN auth_group AS agroup ON ugroup.group_id = agroup.id \
WHERE auser.id = $1;",
          [x.id]
        )
      )
        .map(x => x.rows)
        .map(fp.map(group => group.name))
        .map(groups => ({ groups }));

      return highland([highland([x]), s$]);
    })
    .sequence()
    .reduce1(obj.merge)
    .each(user => {
      socket.request.data = obj.merge({}, socket.request.data, {
        user
      });
      next();
    });
};
