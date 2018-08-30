//
// Copyright (c) 2018 DDN. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

describe("check group", () => {
  let checkGroup,
    mockGroupAllowed,
    mockConf,
    spy,
    req,
    res,
    data,
    next,
    allowGroup,
    mockSerializeError,
    serializedError;

  beforeEach(() => {
    spy = jest.fn();
    mockGroupAllowed = jest.fn();
    mockConf = {
      ALLOW_ANONYMOUS_READ: true
    };
    req = {
      verb: "get"
    };
    res = {
      ack: jest.fn(),
      socket: {
        emit: jest.fn(),
        disconnect: jest.fn()
      }
    };
    data = {};
    next = {};

    mockSerializeError = jest.fn(e => e.message);
    serializedError = "You do not have permissions to make this request.";

    jest.mock("../../../../group/group-allowed", () => mockGroupAllowed);
    jest.mock("../../../../conf", () => mockConf);
    jest.mock("../../../../serialize-error", () => mockSerializeError);

    checkGroup = require("../../../../socket-router/middleware/check-group");
  });

  ["fsUsers", "fsAdmins", "superusers"].forEach(group => {
    describe("group allowed", () => {
      beforeEach(() => {
        mockGroupAllowed.mockReturnValue(true);
        allowGroup = checkGroup[group](spy);
        allowGroup(req, res, data, next);
      });

      it("should call the function", () => {
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(req, res, data, next);
      });

      it("should not call the ack on the response", () => {
        expect(res.ack).not.toHaveBeenCalled();
      });
    });

    describe("group not allowed", () => {
      beforeEach(() => {
        mockGroupAllowed.mockReturnValue(false);
      });

      describe("get request and ALLOW_ANONYMOUS_READ equals true", () => {
        beforeEach(() => {
          allowGroup = checkGroup[group](spy);
          allowGroup(req, res, data, next);
        });

        it("should call the function", () => {
          expect(spy).toHaveBeenCalledTimes(1);
          expect(spy).toHaveBeenCalledWith(req, res, data, next);
        });

        it("should not call the ack on the response", () => {
          expect(res.ack).not.toHaveBeenCalled();
        });
      });

      describe("ALLOW_ANONYMOUS_READ equals false", () => {
        beforeEach(() => {
          mockConf.ALLOW_ANONYMOUS_READ = false;
        });

        describe("response has an ack", () => {
          beforeEach(() => {
            allowGroup = checkGroup[group](spy);
            allowGroup(req, res, data, next);
          });

          it("should not call the function", () => {
            expect(spy).not.toHaveBeenCalled();
          });

          it("should invoke the ack", () => {
            expect(res.ack).toHaveBeenCalledTimes(1);
            expect(res.ack).toHaveBeenCalledWith(serializedError);
          });
        });

        describe("response does not have an ack", () => {
          beforeEach(() => {
            delete res.ack;
            allowGroup = checkGroup[group](spy);
            allowGroup(req, res, data, next);
          });

          it("should not call the function", () => {
            expect(spy).not.toHaveBeenCalled();
          });

          it("should emit the error to the socket", () => {
            expect(res.socket.emit).toHaveBeenCalledTimes(1);
            expect(res.socket.emit).toHaveBeenCalledWith(serializedError);
          });

          it("should disconnect the socket", () => {
            expect(res.socket.disconnect).toHaveBeenCalledTimes(1);
            expect(res.socket.disconnect).toHaveBeenCalledWith(true);
          });
        });
      });
    });
  });
});
