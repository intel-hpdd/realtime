const groups = require("../../../group/groups");

describe("groups", () => {
  it("should provide a superusers group", () => {
    expect(groups.SUPERUSERS).toEqual("superusers");
  });

  it("should provide an fs admins group", () => {
    expect(groups.FS_ADMINS).toEqual("filesystem_administrators");
  });

  it("should provide an fs users group", () => {
    expect(groups.FS_USERS).toEqual("filesystem_users");
  });
});
