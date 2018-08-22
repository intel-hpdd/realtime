"use strict";

var fp = require("intel-fp/dist/fp");
var rewire = require("rewire");
var serializeError = rewire("../../../serialize-error");

describe("error handler", function() {
  var error, errorSerializer, revert;

  beforeEach(function() {
    errorSerializer = jasmine.createSpy("errorSerializer").and.callFake(fp.identity);
    revert = serializeError.__set__("errorSerializer", errorSerializer);

    error = new Error("foo");
  });

  afterEach(function() {
    revert();
  });

  it("should return a normalized response", function() {
    error.statusCode = 404;

    expect(serializeError(error)).toEqual({
      error: error
    });
  });

  it("should add a status code if it's missing", function() {
    var result = serializeError(error);

    expect(result.error.statusCode).toEqual(500);
  });
});
