const highland = require("highland");

describe("session route", () => {
  let mockSocketRouter, mockApiRequest, api$, mockPushSerializeError;

  beforeEach(() => {
    mockSocketRouter = {
      route: jest.fn(() => mockSocketRouter),
      get: jest.fn(() => mockSocketRouter),
      post: jest.fn(() => mockSocketRouter),
      delete: jest.fn(() => mockSocketRouter)
    };
    jest.mock("../../../../socket-router", () => mockSocketRouter);

    api$ = highland();
    mockApiRequest = jest.fn(() => api$);
    jest.mock("../../../../api-request", () => mockApiRequest);

    mockPushSerializeError = jest.fn();
    jest.mock("../../../../serialize-error/push-serialize-error", () => mockPushSerializeError);

    sessionRoute = require("../../../../socket-router/routes/session-route");
    sessionRoute();
  });

  it("should route to /session", () => {
    expect(mockSocketRouter.route).toHaveBeenCalledTimes(1);
    expect(mockSocketRouter.route).toHaveBeenCalledWith("/session");
  });

  it("should register a get request", () => {
    expect(mockSocketRouter.get).toHaveBeenCalledTimes(1);
    expect(mockSocketRouter.get).toHaveBeenCalledWith(expect.any(Function));
  });

  describe("route handling", () => {
    let sessionRoute, req, resp, data, next, user;

    beforeEach(() => {
      data = { method: "get" };
      next = jest.fn();
      user = {
        name: "admin",
        id: 1
      };
    });

    describe("get session route", () => {
      beforeEach(() => {
        sessionRoute = mockSocketRouter.get.mock.calls[0][0];
        req = { messageName: "socket-message-name" };
        resp = {
          socket: {
            emit: jest.fn(),
            request: {
              headers: {}
            }
          }
        };

        api$.write({
          body: {
            user
          }
        });
        api$.end();
        sessionRoute(req, resp, data, next);
      });

      it("should request the session", () => {
        expect(mockApiRequest).toHaveBeenCalledTimes(1);
        expect(mockApiRequest).toHaveBeenCalledWith("/session", {
          method: "get",
          headers: resp.socket.request.headers
        });
      });

      it("should emit the response on the socket", () => {
        expect(resp.socket.emit).toHaveBeenCalledTimes(1);
        expect(resp.socket.emit).toHaveBeenCalledWith("socket-message-name", { user });
      });

      it("should call next", () => {
        expect(next).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledWith(req, resp, expect.any(Object));
      });
    });
  });
});
