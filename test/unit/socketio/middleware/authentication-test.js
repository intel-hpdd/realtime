describe("authentication", () => {
  let mockDbUtils, encodedSessionData, socket, next;
  beforeEach(() => {
    encodedSessionData =
      "ZTdhYjJiYzg3NTVjZmY3ODMyY2UzNzM2NWQyODI3Zjc4NTAxMDk3ZTqAAn1xAShVEl9hdXRoX3VzZXJfYmFja2VuZFUpZGphbmdvLmNvbnRyaWIuYXV0aC5iYWNrZW5kcy5Nb2RlbEJhY2tlbmRVDV9hdXRoX3VzZXJfaWRLAXUu";

    mockDbUtils = {
      query: jest.fn()
    };
    mockDbUtils.query.mockReturnValueOnce([{ rows: [{ session_data: encodedSessionData }] }]);
    mockDbUtils.query.mockReturnValueOnce([{ rowCount: 1, rows: [{ id: 1 }] }]);
    mockDbUtils.query.mockReturnValueOnce([{ rows: [{ name: "superusers" }, { name: "filesystem_administrators" }] }]);

    jest.mock("../../../../db-utils", () => mockDbUtils);

    // sessionData = {
    //   _auth_user_backend: "django.contrib.auth.backends.ModelBackend",
    //   _auth_user_id: 1
    // };

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
      authentication(socket, next);
    });

    it("should query for the session data", () => {
      expect(mockDbUtils.query).toHaveBeenCalledTimes(3);
      expect(mockDbUtils.query).toHaveBeenCalledWith(
        "SELECT session_data FROM django_session WHERE session_key = $1;",
        ["2c162490af12768563cef8fdc77f1eec"]
      );
    });
  });
});
