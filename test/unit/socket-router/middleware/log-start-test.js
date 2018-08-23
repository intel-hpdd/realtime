"use strict";

describe("log start", () => {
  var logStart, mockLogger, revert, next, req, resp;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn()
    };

    jest.mock("../../../../logger", () => mockLogger);

    req = { matches: ["foo"] };

    resp = {};

    next = jest.fn();

    logStart = require("../../../../socket-router/middleware/log-start");
    logStart(req, resp, next);
  });

  it("should call next with the request and response", () => {
    expect(next).toHaveBeenCalledWith(req, resp);
  });
});
