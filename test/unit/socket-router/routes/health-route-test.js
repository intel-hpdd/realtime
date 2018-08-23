const highland = require("highland");

describe("health route", () => {
  let viewer, pool, query, socketRouter, mockSocketGet, s$, mockViewer, mockQuery, viewer$, mockSerializeError;

  beforeEach(() => {
    mockSocketGet = jest.fn();

    jest.mock("../../../../socket-router/index", () => ({
      get: mockSocketGet
    }));

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

    jest.mock("../../../../serialize-error/push-serialize-error", () => mockSerializeError);
    jest.mock("../../../../db-utils", () => ({
      viewer: mockViewer,
      query: mockQuery
    }));
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

    it("should get the health route", () => {
      expect(mockSocketGet).toHaveBeenCalledWith("/health", expect.any(Function));
    });

    describe("health route callback", () => {
      let healthRouteCB, req, resp, next, p, next$;
      beforeEach(() => {
        healthRouteCB = mockSocketGet.mock.calls[0][1];
        req = {
          messageName: "health-message"
        };
        resp = {
          socket: {
            emit: jest.fn()
          }
        };
        next = jest.fn();

        healthRouteCB(req, resp, next);
        next$ = next.mock.calls[0][2];

        p = new Promise((res, rej) => {
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
        p.then(x => {
          expect(mockQuery).toHaveBeenCalledTimes(2);
          done();
        });
      });

      it("should emit the message and data", done => {
        p.then(x => {
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

      healthRouteCB = mockSocketGet.mock.calls[0][1];
      req = {
        messageName: "health-message"
      };
      resp = {
        socket: {
          emit: jest.fn()
        }
      };
      next = jest.fn();

      healthRouteCB(req, resp, next);

      p = new Promise((res, rej) => {
        mockSerializeError.mockImplementation((e, x) => {
          res({ e, x });
        });
      });
    });

    it("should catch the error", done => {
      p.then(({ e, x }) => {
        expect(e).toEqual(streamError);
        done();
      });
    });
  });
});
