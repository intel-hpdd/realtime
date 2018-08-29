// @flow

//
// Copyright (c) 2017 Intel Corporation. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

const validGroups = require("./groups.js");

module.exports = (groupName, groups) =>
  groups.some(group => {
    //Superusers can do everything.
    if (group.name === validGroups.SUPERUSERS) return true;

    //Filesystem administrators can do everything a filesystem user can do.
    if (group.name === validGroups.FS_ADMINS && groupName === validGroups.FS_USERS) return true;

    // Fallback to matching on names.
    return group.name === groupName;
  });
