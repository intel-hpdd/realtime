const highland = require("highland");

describe("health route", () => {
  let mockViewer, mockQuery, viewer$, mockSerializeError, mockCheckGroup, mockSocketRouter, req, data, resp, next;

  beforeEach(() => {
    mockSocketRouter = {
      route: jest.fn(() => mockSocketRouter),
      get: jest.fn(() => mockSocketRouter)
    };

    jest.mock("../../../../socket-router/index", () => mockSocketRouter);

    s$ = highland();

    viewer$ = highland([
      {
        name: "notification",
        length: 55,
        processId: 29875,
        channel: "table_update",
        payload: "INSERT,chroma_core_alertstate,406"
      }
    ]);
    mockViewer = jest.fn(() => viewer$);
    mockQuery = jest.fn();
    mockSerializeError = jest.fn();
    mockCheckGroup = {
      fsUsers: jest.fn(fn => fn)
    };

    jest.mock("../../../../serialize-error/push-serialize-error", () => mockSerializeError);
    jest.mock("../../../../db-utils", () => ({
      viewer: mockViewer,
      query: mockQuery
    }));
    jest.mock("../../../../socket-router/middleware/check-group", () => mockCheckGroup);
  });

  describe("get socket", () => {
    beforeEach(() => {
      mockQuery
        .mockReturnValueOnce(
          Promise.resolve({
            rows: [{ health: "GOOD", num_alerts: 0 }]
          })
        )
        .mockReturnValueOnce(
          Promise.resolve({
            rows: [{ health: "WARNING", num_alerts: 1 }]
          })
        )
        .mockReturnValue(
          Promise.resolve({
            rows: [{ health: "GOOD", num_alerts: 0 }]
          })
        );

      healthRoute = require("../../../../socket-router/routes/health-route");
      healthRoute();
    });

    it("should route to /health", () => {
      expect(mockSocketRouter.route).toHaveBeenCalledWith("/health");
    });

    it("should route with a get", () => {
      expect(mockSocketRouter.get).toHaveBeenCalledWith(mockCheckGroup.fsUsers.mock.calls[0][0]);
    });

    describe("health route callback", () => {
      let healthRouteCB, p, next$;
      beforeEach(() => {
        healthRouteCB = mockCheckGroup.fsUsers.mock.calls[0][0];
        req = {
          messageName: "health-message"
        };
        resp = {
          socket: {
            emit: jest.fn()
          }
        };
        data = {};
        next = jest.fn();

        healthRouteCB(req, resp, data, next);
        next$ = next.mock.calls[0][2];

        p = new Promise(res => {
          resp.socket.emit.mockImplementation((name, x) => {
            if (mockQuery.mock.calls.length === 2) res({ name, x });
          });
        });
      });

      it("should query the db for health status", done => {
        p.then(() => {
          expect(mockQuery).toHaveBeenCalledWith("select * from health_status()");
          done();
        });
      });

      it("should query the db twice", done => {
        p.then(() => {
          expect(mockQuery).toHaveBeenCalledTimes(2);
          done();
        });
      });

      it("should emit the message and data", done => {
        p.then(() => {
          expect(resp.socket.emit).toHaveBeenCalledWith("health-message", { health: "WARNING", count: 1 });
          done();
        });
      });

      it("should call next", () => {
        expect(next).toHaveBeenCalledWith(req, resp, next$);
      });
    });
  });

  describe("on stream error", () => {
    let streamError;
    beforeEach(() => {
      streamError = new Error("stream-error");
      mockQuery.mockReturnValue(Promise.reject(streamError));

      healthRoute = require("../../../../socket-router/routes/health-route");
      healthRoute();

      healthRouteCB = mockCheckGroup.fsUsers.mock.calls[0][0];
      req = {
        messageName: "health-message"
      };
      data = {};
      resp = {
        socket: {
          emit: jest.fn()
        }
      };
      next = jest.fn();

      healthRouteCB(req, resp, data, next);

      p = new Promise(res => {
        mockSerializeError.mockImplementation((e, x) => {
          res({ e, x });
        });
      });
    });

    it("should catch the error", done => {
      p.then(({ e }) => {
        expect(e).toEqual(streamError);
        done();
      });
    });
  });
});
