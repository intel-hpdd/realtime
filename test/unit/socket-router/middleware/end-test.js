"use strict";

describe("end spec", () => {
  var mockLogger, next, req, resp, revert, stream, onDestroy, end;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn()
    };

    jest.mock("../../../../logger", () => mockLogger);

    next = jest.fn();

    req = { matches: ["foo"] };

    resp = {
      socket: {
        once: jest.fn()
      }
    };

    stream = {
      destroy: jest.fn()
    };

    end = require("../../../../socket-router/middleware/end");

    end(req, resp, stream, next);

    onDestroy = resp.socket.once.mock.calls[0][1];
  });

  it("should call next with the request and response", () => {
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(req, resp);
  });

  it("should not call destroy if nil was seen", () => {
    stream._nil_seen = true;

    onDestroy();

    expect(stream.destroy).not.toHaveBeenCalled();
  });

  it("should not call destroy if stream was ended", () => {
    stream.ended = true;

    onDestroy();

    expect(stream.destroy).not.toHaveBeenCalled();
  });

  it("should not call destroy twice", () => {
    onDestroy();
    onDestroy();

    expect(stream.destroy).toHaveBeenCalledTimes(1);
  });
});
