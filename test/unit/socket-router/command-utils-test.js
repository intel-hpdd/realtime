"use strict";

var fixtures = require("../../integration/fixtures");
var highland = require("highland");
var obj = require("intel-obj");
var fp = require("intel-fp/dist/fp");

describe("command utils", () => {
  var revoke, mockApiRequest, responseStream, mockPollingRequest, pollStream, commandUtils;

  beforeEach(() => {
    responseStream = highland();
    mockApiRequest = jest.fn(() => responseStream);

    pollStream = highland();
    jest.spyOn(pollStream, "destroy");
    mockPollingRequest = jest.fn(() => pollStream);

    jest.mock("../../../api-request", () => mockApiRequest);
    jest.mock("../../../polling-request", () => mockPollingRequest);

    commandUtils = require("../../../socket-router/command-utils");
  });

  describe("wait for commands", () => {
    var waiter, commandData;

    beforeEach(() => {
      commandData = {
        body: {
          objects: [
            {
              id: 1,
              complete: true
            },
            {
              id: 2,
              complete: true
            }
          ]
        }
      };

      waiter = commandUtils.waitForCommands(
        {
          Cookie: "sessionid=123"
        },
        ["1", "2"]
      );
    });

    it("should be a function", () => {
      expect(commandUtils.waitForCommands).toEqual(expect.any(Function));
    });

    it("should return a stream", () => {
      expect(highland.isStream(waiter)).toBe(true);
    });

    describe("getting values", () => {
      var spy;

      beforeEach(() => {
        spy = jest.fn();
        waiter.pull(spy);
      });

      it("should pass the headers and ids to pollingRequest", () => {
        expect(mockPollingRequest).toHaveBeenCalledTimes(1);
        expect(mockPollingRequest).toHaveBeenCalledWith("/command", {
          headers: {
            Cookie: "sessionid=123"
          },
          qs: {
            id__in: ["1", "2"],
            limit: 0
          }
        });
      });

      it("should push the value downstream", () => {
        pollStream.write(commandData);
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(null, commandData.body.objects);
      });

      it("should push nil downstream", function(done) {
        pollStream.write(commandData);
        pollStream.write(highland.nil);
        waiter.errors(done.fail).pull(spy);

        process.nextTick(() => {
          expect(spy).toHaveBeenCalledTimes(2);
          expect(spy).toHaveBeenCalledWith(null, highland.nil);
          done();
        });
      });

      it("should destroy on data", function(done) {
        pollStream.write(commandData);

        process.nextTick(() => {
          expect(pollStream.destroy).toHaveBeenCalledTimes(1);
          done();
        });
      });

      it("should push an error downstream", () => {
        var err = new Error("boom!");
        pollStream.write(new StreamError(err));
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(err, undefined);
      });

      it("should not return on unfinished commands", () => {
        var incompleteData = obj.clone(commandData);
        incompleteData.body.objects[0].complete = false;

        pollStream.write(incompleteData);

        expect(spy).not.toHaveBeenCalled();
      });
    });
  });

  describe("get steps", () => {
    var commands, jobs, commandStream, resultStream, spy;

    beforeEach(() => {
      spy = jest.fn();
      commands = fixtures.command().twoServers.response.data.objects;

      jobs = fixtures.job().twoServers.response.data;

      commandStream = highland();
      resultStream = commandUtils.getSteps(
        {
          Cookie: "sessionid=123"
        },
        commandStream
      );
    });

    it("should call apiRequest with job ids", () => {
      commandStream.write(commands);
      commandStream.end();

      resultStream.each(fp.noop);
      expect(mockApiRequest).toHaveBeenCalledTimes(1);
      expect(mockApiRequest).toHaveBeenCalledWith("/job", {
        headers: {
          Cookie: "sessionid=123"
        },
        qs: {
          id__in: ["2", "3"],
          limit: 0
        },
        jsonMask: "objects(step_results,steps)"
      });
    });

    it("should return the steps", function(done) {
      commandStream.write(commands);
      commandStream.end();
      responseStream.write({
        body: jobs
      });
      responseStream.end();

      resultStream.errors(done.fail).each(function(x) {
        var result = fp.flow(
          fp.lensProp("objects"),
          fp.map(fp.lensProp("step_results")),
          fp.map(obj.values),
          fp.unwrap
        )(jobs);

        expect(x).toEqual(result);
        done();
      });
    });

    it("should return empty on no data", () => {
      commandStream.end();

      resultStream.otherwise(highland(["nope"])).each(spy);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith("nope");
    });

    it("should throw on error", function(done) {
      var boom = new Error("boom!");
      commandStream.write(new StreamError(boom));

      resultStream
        .errors(function(err) {
          expect(err).toEqual(err);
          done();
        })
        .each(done.fail);
    });
  });
});

function StreamError(err) {
  this.__HighlandStreamError__ = true;
  this.error = err;
}
