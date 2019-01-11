"use strict";

const requestValidator = require("../../request-validator");

describe("request channel validator", () => {
  it("should fail on an empty argument", () => {
    expect(requestValidator()).toEqual("instance is required\n");
  });

  it("should fail if object is the wrong type", () => {
    expect(requestValidator([])).toEqual("instance is not of a type(s) object\ninstance.path is required\n");
  });

  it("should fail if path is not included", () => {
    expect(requestValidator({})).toEqual("instance.path is required\n");
  });

  it("should fail if method is the wrong name", () => {
    expect(requestValidator({ path: "/foo", options: { method: "got" } })).toEqual(
      "instance.options.method is not one of enum values: get,post,put,patch,delete\n"
    );
  });

  it("should pass if data is good", () => {
    expect(requestValidator({ path: "/foo", options: { method: "get" } })).toEqual("");
  });

  it("should allow options to be optional", () => {
    expect(requestValidator({ path: "/foo" })).toEqual("");
  });
});
