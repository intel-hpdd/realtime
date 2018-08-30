const groupAllowed = require("../../../group/group-allowed");
const GROUPS = require("../../../group/groups");

describe("group allowed", () => {
  it("should throw if groups are not provided", () => {
    expect(() => groupAllowed(GROUPS.FS_USERS)).toThrow(new TypeError("Cannot read property 'some' of undefined"));
  });

  describe("superusers", () => {
    Object.keys(GROUPS).forEach(key => {
      it(`should be allowed with an ${GROUPS[key]} group level`, () => {
        expect(groupAllowed(GROUPS[key], [GROUPS.SUPERUSERS])).toBe(true);
      });
    });
  });

  describe("fs users", () => {
    it("should be allowed with an fs users group level", () => {
      expect(groupAllowed(GROUPS.FS_USERS, [GROUPS.FS_USERS])).toBe(true);
    });

    it("should not be allowed with an fs admin group level", () => {
      expect(groupAllowed(GROUPS.FS_ADMINS, [GROUPS.FS_USERS])).toBe(false);
    });

    it("should not be allowed with a superuser group level", () => {
      expect(groupAllowed(GROUPS.SUPERUSERS, [GROUPS.FS_USERS])).toBe(false);
    });
  });

  describe("fs admins", () => {
    it("should be allowed with an fs admin group level", () => {
      expect(groupAllowed(GROUPS.FS_ADMINS, [GROUPS.FS_ADMINS])).toBe(true);
    });

    it("should be allowed with an fs user group level", () => {
      expect(groupAllowed(GROUPS.FS_USERS, [GROUPS.FS_ADMINS])).toBe(true);
    });

    it("should not be allowed with a superuser group level", () => {
      expect(groupAllowed(GROUPS.SUPERUSERS, [GROUPS.FS_ADMINS])).toBe(false);
    });
  });
});
