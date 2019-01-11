"use strict";

describe("push serialize error", () => {
  let err, push, mockSerializeError, serializedError, pushSerializeError;
  beforeEach(() => {
    err = new Error("im an error");
    push = jest.fn();
    serializedError = { error: "im an error" };
    mockSerializeError = jest.fn(() => serializedError);

    jest.mock("../../../serialize-error/index", () => mockSerializeError);
    pushSerializeError = require("../../../serialize-error/push-serialize-error");

    pushSerializeError(err, push);
  });

  it("should push", () => {
    expect(push).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith(null, serializedError);
  });

  it("should invoke serializeError with the error", () => {
    expect(mockSerializeError).toHaveBeenCalledTimes(1);
    expect(mockSerializeError).toHaveBeenCalledWith(err);
  });
});
