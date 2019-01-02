const jpickle = require("jpickle");

describe("authentication", () => {
  let mockDbUtils, mockJPickle, encodedSessionData, socket, next;
  beforeEach(() => {
    encodedSessionData =
      "ZTdhYjJiYzg3NTVjZmY3ODMyY2UzNzM2NWQyODI3Zjc4NTAxMDk3ZTqAAn1xAShVEl9hdXRoX3VzZXJfYmFja2VuZFUpZGphbmdvLmNvbnRyaWIuYXV0aC5iYWNrZW5kcy5Nb2RlbEJhY2tlbmRVDV9hdXRoX3VzZXJfaWRLAXUu";

    mockDbUtils = {
      query: jest.fn()
    };
    jest.mock("../../../../db-utils", () => mockDbUtils);

    mockJPickle = {
      loads: jest.fn(x => jpickle.loads(x))
    };
    jest.mock("jpickle", () => mockJPickle);

    socket = {
      request: {
        data: {},
        headers: {
          cookie:
            "csrftoken=uYw6ElvvfaXN7nrKJL0osP7Y0oASdMcj; sessionid=2c162490af12768563cef8fdc77f1eec; io=cTLXFEtdJgSC02OtAAAB"
        }
      }
    };

    next = jest.fn();

    authentication = require("../../../../socketio/middleware/authentication");
  });

  describe("with matching session", () => {
    beforeEach(() => {
      mockDbUtils.query.mockReturnValueOnce([{ rows: [{ session_data: encodedSessionData }] }]);
      mockDbUtils.query.mockReturnValueOnce([{ rowCount: 1, rows: [{ id: 1 }] }]);
      mockDbUtils.query.mockReturnValueOnce([
        { rows: [{ name: "superusers" }, { name: "filesystem_administrators" }] }
      ]);
      authentication(socket, next);
    });

    it("should query for the session data", () => {
      expect(mockDbUtils.query).toHaveBeenCalledTimes(3);
      expect(mockDbUtils.query).toHaveBeenCalledWith(
        "SELECT session_data FROM django_session WHERE session_key = $1 AND expire_date > NOW();",
        ["2c162490af12768563cef8fdc77f1eec"]
      );
    });

    it("should load the pickled string", () => {
      expect(mockJPickle.loads).toHaveBeenCalledTimes(1);
      expect(mockJPickle.loads).toHaveBeenCalledWith(
        Buffer.from(encodedSessionData, "base64")
          .toString("binary")
          .split(":")[1]
      );
    });

    it("should query the user", () => {
      expect(mockDbUtils.query).toHaveBeenCalledWith("SELECT * FROM auth_user WHERE id = $1", [1]);
    });

    it("should query the groups associated with the user id", () => {
      expect(mockDbUtils.query).toHaveBeenCalledWith(
        "SELECT agroup.name FROM auth_user AS auser INNER JOIN auth_user_groups AS ugroup ON auser.id = ugroup.user_id INNER JOIN auth_group AS agroup ON ugroup.group_id = agroup.id WHERE auser.id = $1;",
        [1]
      );
    });
  });

  describe("with no matching data", () => {
    beforeEach(() => {
      mockDbUtils.query.mockReturnValueOnce([{ rows: [{ session_data: encodedSessionData }] }]);
      mockDbUtils.query.mockReturnValueOnce([{ rowCount: 0, rows: [] }]);

      authentication(socket, next);
    });

    it("should query for the session data", () => {
      expect(mockDbUtils.query).toHaveBeenCalledTimes(2);
      expect(mockDbUtils.query).toHaveBeenCalledWith(
        "SELECT session_data FROM django_session WHERE session_key = $1 AND expire_date > NOW();",
        ["2c162490af12768563cef8fdc77f1eec"]
      );
    });

    it("should load the pickled string", () => {
      expect(mockJPickle.loads).toHaveBeenCalledTimes(1);
      expect(mockJPickle.loads).toHaveBeenCalledWith(
        Buffer.from(encodedSessionData, "base64")
          .toString("binary")
          .split(":")[1]
      );
    });

    it("should query the user", () => {
      expect(mockDbUtils.query).toHaveBeenCalledWith("SELECT * FROM auth_user WHERE id = $1", [1]);
    });
  });

  describe("resolved data", () => {
    describe("when a session is not found", () => {
      it("should not emit user data", done => {
        next.mockImplementation(() => {
          expect(socket.request.data).toEqual({});
          done();
        });

        mockDbUtils.query.mockReturnValueOnce([{ rows: [{ session_data: encodedSessionData }] }]);
        mockDbUtils.query.mockReturnValueOnce([{ rowCount: 0, rows: [] }]);

        authentication(socket, next);
      });
    });

    describe("when a session is found", () => {
      it("should set the user on the data object", done => {
        next.mockImplementation(() => {
          expect(socket.request.data).toEqual({ user: { groups: ["superusers", "filesystem_administrators"], id: 1 } });
          done();
        });

        mockDbUtils.query.mockReturnValueOnce([{ rows: [{ session_data: encodedSessionData }] }]);
        mockDbUtils.query.mockReturnValueOnce([{ rowCount: 1, rows: [{ id: 1 }] }]);
        mockDbUtils.query.mockReturnValueOnce([
          { rows: [{ name: "superusers" }, { name: "filesystem_administrators" }] }
        ]);

        authentication(socket, next);
      });
    });
  });

  describe("with no session data", () => {
    beforeEach(() => {
      mockDbUtils.query.mockReturnValueOnce([{ rows: [] }]);
    });

    it("should call next", () => {
      authentication(socket, next);
      expect(next).toHaveBeenCalledTimes(1);
    });

    it("should only run the first query", () => {
      authentication(socket, next);
      expect(mockDbUtils.query).toHaveBeenCalledTimes(1);
    });

    it("should not contain user data", done => {
      next.mockImplementation(() => {
        expect(socket.request.data).toEqual({});
        done();
      });

      authentication(socket, next);
    });
  });
});
