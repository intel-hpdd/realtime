//
// Copyright (c) 2018 DDN. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

const validGroups = require("./groups.js");

module.exports = (groupLevel, groups) =>
  groups.some(group => {
    //Superusers can do everything.
    if (group === validGroups.SUPERUSERS) return true;

    //Filesystem administrators can do everything a filesystem user can do.
    if (group === validGroups.FS_ADMINS && groupLevel === validGroups.FS_USERS) return true;

    // Fallback to matching on names.
    return group === groupLevel;
  });
