"use strict";

var fp = require("intel-fp/dist/fp");

describe("error handler", () => {
  var error, revert, mockIntelLogger, serializeError;

  beforeEach(() => {
    mockIntelLogger = {
      serializers: {
        err: jest.fn(fp.identity)
      }
    };
    jest.mock("intel-logger", () => mockIntelLogger);

    error = new Error("foo");

    serializeError = require("../../../serialize-error/index");
  });

  it("should return a normalized response", () => {
    error.statusCode = 404;

    expect(serializeError(error)).toEqual({
      error
    });
  });

  it("should add a status code if it's missing", () => {
    var result = serializeError(error);

    expect(result.error.statusCode).toEqual(500);
  });
});
