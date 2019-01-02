"use strict";

const highland = require("highland");
const fp = require("intel-fp/dist/fp");

const createStream = () => {
  const s = highland();
  s.abort = jest.fn(() => "abort");
  return s;
};

describe("polling request", function() {
  let pollingRequest, mockApiRequest, r, s;

  beforeEach(function() {
    mockApiRequest = jest.fn();
    jest.mock("../../api-request", () => mockApiRequest);
  });

  beforeEach(() => {
    mockApiRequest.mockImplementation(() => {
      s = createStream();
      return s;
    });

    pollingRequest = require("../../polling-request");
  });

  it("should be a function", function() {
    expect(pollingRequest).toEqual(expect.any(Function));
  });

  describe("invoking", function() {
    beforeEach(function() {
      r = pollingRequest("/foo", {
        bar: "baz"
      });
    });

    it("should return a stream", function() {
      expect(highland.isStream(r)).toBe(true);
    });

    it("should make a request with the params", function() {
      r.each(fp.noop);

      expect(mockApiRequest).toHaveBeenCalledTimes(1);
      expect(mockApiRequest).toHaveBeenCalledWith("/foo", {
        bar: "baz"
      });
    });

    it("should emit data", function(done) {
      r.stopOnError(done.fail).each(function(x) {
        expect(x).toEqual({
          statusCode: 200
        });
        done();
      });

      s.write({
        statusCode: 200
      });
      s.end();
    });

    it("should emit errors", function(done) {
      r.stopOnError(function(err) {
        expect(err.message).toEqual("boom!");
        done();
      }).each(done.fail);

      s.write({
        __HighlandStreamError__: true,
        error: new Error("boom!")
      });
      s.end();
    });

    it("should abort if stream is destroyed", function() {
      r.each(fp.noop);

      r.destroy();

      expect(s.abort).toHaveBeenCalledTimes(1);
    });

    it("should not abort if request has finished", function() {
      r.each(fp.noop);
      s.write({
        statusCode: 200
      });
      s.end();
      r.destroy();

      expect(s.abort).not.toHaveBeenCalled();
    });
  });
});
