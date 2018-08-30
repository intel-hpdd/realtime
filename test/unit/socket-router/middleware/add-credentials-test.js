"use strict";

describe("add credentials", function() {
  let next, req, resp, addCredentials;

  beforeEach(function() {
    next = jest.fn();

    jest.mock("../../../../conf", () => ({
      API_USER: "api",
      API_KEY: "api-key"
    }));

    req = { data: { key: "val" } };

    resp = {
      socket: {
        request: {
          headers: {
            "user-agent": "bar"
          }
        }
      }
    };

    addCredentials = require("../../../../socket-router/middleware/add-credentials");
  });

  it("should call next", function() {
    addCredentials(req, resp, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(
      {
        data: { key: "val" }
      },
      {
        socket: {
          request: {
            headers: {
              "user-agent": "bar"
            }
          }
        }
      },
      {
        key: "val",
        headers: {
          Authorization: "ApiKey api:api-key",
          "User-Agent": "bar"
        }
      }
    );
  });

  it("should merge with existing headers", function() {
    req.data.headers = {
      "X-Foo-Header": "foo"
    };

    addCredentials(req, resp, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(
      {
        data: {
          headers: {
            "X-Foo-Header": "foo"
          },
          key: "val"
        }
      },
      {
        socket: {
          request: {
            headers: {
              "user-agent": "bar"
            }
          }
        }
      },
      {
        headers: {
          Authorization: "ApiKey api:api-key",
          "User-Agent": "bar",
          "X-Foo-Header": "foo"
        },
        key: "val"
      }
    );
  });

  it("should not override existing headers", function() {
    req.data.headers = {
      "User-Agent": "use this header"
    };

    addCredentials(req, resp, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(
      {
        data: {
          headers: {
            "User-Agent": "use this header"
          },
          key: "val"
        }
      },
      {
        socket: {
          request: {
            headers: {
              "user-agent": "bar"
            }
          }
        }
      },
      {
        headers: {
          Authorization: "ApiKey api:api-key",
          "User-Agent": "use this header"
        },
        key: "val"
      }
    );
  });
});
