const highland = require("highland");

describe("test host route", () => {
  let api$,
    mockApiRequest,
    mockSocketRouter,
    mockPushSerializeError,
    mockCommandUtils,
    mockCheckGroup,
    testHostRoute,
    waitForCommandsSpy,
    getStepsSpy;

  beforeEach(() => {
    api$ = highland();
    mockApiRequest = jest.fn();
    mockApiRequest.mockReturnValueOnce(api$);
    mockApiRequest.mockReturnValueOnce(highland());
    jest.mock("../../../../api-request", () => mockApiRequest);

    mockSocketRouter = {
      route: jest.fn(() => mockSocketRouter),
      post: jest.fn(() => mockSocketRouter)
    };
    jest.mock("../../../../socket-router", () => mockSocketRouter);

    mockPushSerializeError = jest.fn();
    jest.mock("../../../../serialize-error/push-serialize-error", () => mockPushSerializeError);

    waitForCommandsSpy = jest.fn(s$ => s$);
    getStepsSpy = jest.fn(s$ => s$);
    mockCommandUtils = {
      waitForCommands: jest.fn(() => waitForCommandsSpy),
      getSteps: jest.fn(() => getStepsSpy)
    };
    jest.mock("../../../../socket-router/command-utils", () => mockCommandUtils);

    mockCheckGroup = {
      fsAdmins: jest.fn(fn => fn)
    };
    jest.mock("../../../../socket-router/middleware/check-group", () => mockCheckGroup);

    testHostRoute = require("../../../../socket-router/routes/test-host-route");
    testHostRoute();
  });

  it("should call the test_host route", () => {
    expect(mockSocketRouter.route).toHaveBeenCalledTimes(1);
    expect(mockSocketRouter.route).toHaveBeenCalledWith("/test_host");
  });

  it("should handle a post request", () => {
    expect(mockSocketRouter.post).toHaveBeenCalledTimes(1);
    expect(mockSocketRouter.post).toHaveBeenCalledWith(expect.any(Function));
  });

  describe("handle post request", () => {
    let postHandler, req, resp, data, next, stream;

    beforeEach(() => {
      postHandler = mockCheckGroup.fsAdmins.mock.calls[0][0];
      req = { messageName: "message-name" };
      resp = {
        socket: {
          emit: jest.fn()
        }
      };
      data = {
        headers: {}
      };
      next = jest.fn();

      api$.write({
        body: {
          objects: [
            {
              command: {
                cancelled: false,
                complete: false,
                created_at: "2018-08-30T17:41:41.302840",
                errored: false,
                id: 19903,
                jobs: ["/api/job/20003/"],
                logs: "",
                message: "Validation host configuration mds1.local",
                resource_uri: "/api/command/19903/"
              },
              error: null,
              traceback: null
            }
          ]
        }
      });
      api$.end();
    });

    describe("on success", () => {
      beforeEach(() => {
        postHandler(req, resp, data, next);
        stream = next.mock.calls[0][2];
      });

      afterEach(() => {
        stream.destroy();
      });

      it("should call apiRequest", () => {
        expect(mockApiRequest).toHaveBeenCalledTimes(2);
        expect(mockApiRequest).toHaveBeenCalledWith("/test_host", data);
      });

      it("should wait for commands", () => {
        expect(mockCommandUtils.waitForCommands).toHaveBeenCalledTimes(2);
        expect(mockCommandUtils.waitForCommands).toHaveBeenCalledWith(data.headers);
        expect(waitForCommandsSpy).toHaveBeenCalledWith([19903]);
      });

      it("should get steps", () => {
        expect(mockCommandUtils.getSteps).toHaveBeenCalledTimes(2);
        expect(mockCommandUtils.getSteps).toHaveBeenCalledWith(data.headers);
        expect(getStepsSpy).toHaveBeenCalledWith(expect.any(Object));
      });

      it("should not push a serialized error", () => {
        expect(mockPushSerializeError).not.toHaveBeenCalled();
      });

      it("should emit the body", () => {
        expect(resp.socket.emit).toHaveBeenCalledTimes(1);
        expect(resp.socket.emit).toHaveBeenCalledWith(req.messageName, 19903);
      });
    });

    describe("on error", () => {
      let error;
      beforeEach(() => {
        error = new Error("some error");
        getStepsSpy.mockImplementation(() => {
          return highland([
            {
              __HighlandStreamError__: true,
              error
            }
          ]);
        });
        postHandler(req, resp, data, next);
        stream = next.mock.calls[0][2];
      });

      it("should push the serialized error", () => {
        expect(mockPushSerializeError).toHaveBeenCalledTimes(2);
        expect(mockPushSerializeError).toHaveBeenCalledWith(error, expect.any(Function));
      });

      it("should not emit", () => {
        expect(resp.socket.emit).not.toHaveBeenCalled();
      });
    });
  });
});
