const highland = require("highland");

describe("wildcard route", () => {
  let mockApiRequest,
    requestToPath,
    api$,
    mockSocketRouter,
    mockPushSerializeError,
    mockCheckGroup,
    wildcardRoute,
    error;

  beforeEach(() => {
    api$ = highland();
    requestToPath = jest.fn(() => api$);
    mockApiRequest = jest.fn(() => requestToPath);
    jest.mock("../../../../api-request", () => mockApiRequest);

    mockSocketRouter = {
      route: jest.fn(() => mockSocketRouter),
      all: jest.fn(() => mockSocketRouter)
    };
    jest.mock("../../../../socket-router", () => mockSocketRouter);

    mockPushSerializeError = jest.fn();
    jest.mock("../../../../serialize-error/push-serialize-error", () => mockPushSerializeError);

    mockCheckGroup = {
      fsUsers: jest.fn(fn => fn)
    };
    jest.mock("../../../../socket-router/middleware/check-group", () => mockCheckGroup);

    error = new Error("some error");

    wildcardRoute = require("../../../../socket-router/routes/wildcard-route");
  });

  describe("initialization", () => {
    beforeEach(() => {
      wildcardRoute();
    });

    it("should define the route", () => {
      expect(mockSocketRouter.route).toHaveBeenCalledTimes(1);
      expect(mockSocketRouter.route).toHaveBeenCalledWith("/:endpoint/:rest*");
    });

    it("should handle all requests", () => {
      expect(mockSocketRouter.all).toHaveBeenCalledTimes(1);
      expect(mockSocketRouter.all).toHaveBeenCalledWith(mockCheckGroup.fsUsers.mock.calls[0][0]);
    });

    it("should specify fsUsers group level", () => {
      expect(mockCheckGroup.fsUsers).toHaveBeenCalledTimes(1);
      expect(mockCheckGroup.fsUsers).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  describe("handle fsUsers", () => {
    let handler, req, resp, data, next;
    beforeEach(() => {
      wildcardRoute();
      handler = mockCheckGroup.fsUsers.mock.calls[0][0];
      req = {
        verb: "get",
        matches: ["/target", "target"],
        messageName: "message-name"
      };
      resp = {
        ack: jest.fn(),
        socket: {
          emit: jest.fn()
        }
      };
      data = {};
      next = jest.fn();

      body = {
        someData: {}
      };
    });

    describe("with ack on response", () => {
      let body;
      beforeEach(() => {
        handler(req, resp, data, next);
      });

      describe("on success", () => {
        beforeEach(() => {
          api$.write({
            body
          });
          api$.end();
        });

        it("should call apiRequest", () => {
          expect(mockApiRequest).toHaveBeenCalledTimes(1);
          expect(mockApiRequest).toHaveBeenCalledWith("/target");
        });

        it("should call requestToPath", () => {
          expect(requestToPath).toHaveBeenCalledTimes(1);
          expect(requestToPath).toHaveBeenCalledWith({ method: "GET" });
        });

        it("should call the ack with the body", () => {
          expect(resp.ack).toHaveBeenCalledTimes(1);
          expect(resp.ack).toHaveBeenCalledWith(body);
        });

        it("should not push a serialized error", () => {
          expect(mockPushSerializeError).not.toHaveBeenCalled();
        });
      });

      describe("on error", () => {
        beforeEach(() => {
          api$.write({
            __HighlandStreamError__: true,
            error
          });
          api$.end();
        });

        it("should push the serialized error", () => {
          expect(mockPushSerializeError).toHaveBeenCalledTimes(1);
          expect(mockPushSerializeError).toHaveBeenCalledWith(error, expect.any(Function));
        });
      });
    });

    describe("with no ack", () => {
      beforeEach(() => {
        delete resp.ack;
        handler(req, resp, data, next);
      });

      afterEach(() => {
        stream = next.mock.calls[0][2];
        stream.destroy();
      });

      describe("on success", () => {
        beforeEach(() => {
          api$.write({
            body
          });
          api$.end();
        });

        it("should emit the body", () => {
          expect(resp.socket.emit).toHaveBeenCalledTimes(1);
          expect(resp.socket.emit).toHaveBeenCalledWith(req.messageName, body);
        });

        it("should not push a serialized error", () => {
          expect(mockPushSerializeError).not.toHaveBeenCalled();
        });
      });

      describe("on error", () => {
        beforeEach(() => {
          api$.write({
            __HighlandStreamError__: true,
            error
          });
          api$.end();
        });

        it("should push the serialized error", () => {
          expect(mockPushSerializeError).toHaveBeenCalledTimes(1);
          expect(mockPushSerializeError).toHaveBeenCalledWith(error, expect.any(Function));
        });

        it("should not emit", () => {
          expect(resp.socket.emit).not.toHaveBeenCalled();
        });
      });
    });
  });
});
