"use strict";

describe("realtime index test", () => {
  let mockCreateIo,
    io,
    mockConf,
    socket,
    data,
    ack,
    mockRequestValidator,
    mockSocketRouter,
    mockSerializeError,
    mockEventWildcard,
    mockAuthentication,
    consoleLog,
    consoleError,
    processOn;

  beforeEach(() => {
    mockConf = {
      REALTIME_PORT: 8888
    };

    io = {
      attach: jest.fn(),
      on: jest.fn(),
      close: jest.fn(),
      use: jest.fn()
    };

    mockCreateIo = jest.fn(() => io);

    consoleLog = console.log;
    consoleError = console.error;
    processOn = process.on;

    console.log = jest.fn();
    console.error = jest.fn();
    process.on = jest.fn();
    process.exit = jest.fn();

    socket = {
      on: jest.fn(),
      emit: jest.fn(),
      write: jest.fn(),
      request: {
        data: {
          user: {
            id: 1,
            groups: "fs_admin"
          }
        }
      }
    };

    data = {
      options: {},
      path: "/api/alert/",
      method: "get",
      eventName: "message1"
    };

    ack = jest.fn();
    mockSocketRouter = {
      go: jest.fn()
    };

    mockRequestValidator = jest.fn();
    mockSerializeError = jest.fn();
    mockEventWildcard = jest.fn();
    mockAuthentication = jest.fn();

    jest.mock("../../conf", () => mockConf);
    jest.mock("socket.io", () => mockCreateIo);
    jest.mock("../../request-validator", () => mockRequestValidator);
    jest.mock("../../socket-router", () => mockSocketRouter);
    jest.mock("../../serialize-error", () => mockSerializeError);
    jest.mock("../../event-wildcard", () => mockEventWildcard);
    jest.mock("../../socketio/middleware/authentication", () => mockAuthentication);
  });

  afterEach(() => {
    console.log = consoleLog;
    console.error = consoleError;
    process.on = processOn;
  });

  describe("setup events", () => {
    beforeEach(() => {
      require("../../index");
    });

    it("should register two middlewares", () => {
      expect(io.use).toHaveBeenCalledTimes(2);
    });

    it("should register the eventWildcard middleware", () => {
      expect(io.use).toHaveBeenCalledWith(mockEventWildcard);
    });

    it("should register the authentication middleware", () => {
      expect(io.use).toHaveBeenCalledWith(mockAuthentication);
    });

    it("should call createIo", () => {
      expect(mockCreateIo).toHaveBeenCalledTimes(1);
    });

    it("should call io.attach with the realtime port", () => {
      expect(io.attach).toHaveBeenCalledTimes(1);
      expect(io.attach).toHaveBeenCalledWith(mockConf.REALTIME_PORT, { wsEngine: "uws" });
    });

    it("should register a connection event handler on io", () => {
      expect(io.on).toHaveBeenCalledTimes(1);
      expect(io.on).toHaveBeenCalledWith("connection", expect.any(Function));
    });
  });

  describe("on io", () => {
    beforeEach(() => {
      io.on.mockImplementation((evt, fn) => {
        if (evt === "connection") fn(socket);
      });
    });

    describe("connection event", () => {
      it("should register the socket wildcard event", () => {
        require("../../index");
        expect(socket.on).toHaveBeenCalledTimes(2);
        expect(socket.on).toHaveBeenCalledWith("*", expect.any(Function));
      });

      describe("on socket wildcard", () => {
        describe("with no matching event name", () => {
          beforeEach(() => {
            data.eventName = "non-matching-event-name";
            socket.on.mockImplementation((evt, fn) => {
              if (evt === "*") fn(data, ack);
            });
            require("../../index");
          });

          it("should not call the requestValidator", () => {
            expect(mockRequestValidator).not.toHaveBeenCalled();
          });

          it("should not call socketRouter.go", () => {
            expect(mockSocketRouter.go).not.toHaveBeenCalled();
          });
        });

        describe("when handling the request", () => {
          beforeEach(() => {
            socket.on.mockImplementation((evt, fn) => {
              if (evt === "*") fn(data, ack);
            });
          });

          describe("success", () => {
            beforeEach(() => {
              mockRequestValidator.mockReturnValue([]);
              require("../../index");
            });

            it("should call requestValidator", () => {
              expect(mockRequestValidator).toHaveBeenCalledTimes(1);
              expect(mockRequestValidator).toHaveBeenCalledWith(data);
            });

            it("should call socketRouter with the appropriate data", () => {
              expect(mockSocketRouter.go).toHaveBeenCalledTimes(1);
              expect(mockSocketRouter.go).toHaveBeenCalledWith(
                data.path,
                {
                  verb: data.method,
                  data: {
                    qs: {},
                    groups: "fs_admin"
                  },
                  messageName: "message1",
                  endName: "end1"
                },
                {
                  socket: socket,
                  ack: expect.any(Function)
                }
              );
            });
          });

          describe("error", () => {
            let error, serializedError;
            beforeEach(() => {
              error = "something bad happened";
              serializedError = "serialized error";
              mockSerializeError.mockReturnValue(serializedError);
              mockRequestValidator.mockReturnValue(error);
            });

            describe("with ack", () => {
              it("should ack the error", () => {
                require("../../index");

                expect(ack).toHaveBeenCalledTimes(1);
                expect(ack).toHaveBeenCalledWith(serializedError);
              });
            });

            describe("without ack", () => {
              it("should call socket.emit to the message with the error", () => {
                ack = null;
                require("../../index");

                expect(socket.emit).toHaveBeenCalledTimes(1);
                expect(socket.emit).toHaveBeenCalledWith("message1", serializedError);
              });
            });
          });
        });
      });

      it("should register the socket error event", () => {
        require("../../index");
        expect(socket.on).toHaveBeenCalledTimes(2);
        expect(socket.on).toHaveBeenCalledWith("error", expect.any(Function));
      });

      describe("on socket error", () => {
        let err;
        beforeEach(() => {
          err = new Error("something bad happend");
          socket.on.mockImplementation((evt, fn) => {
            if (evt === "error") fn(err);
          });
          require("../../index");
        });

        it("should log the error", () => {
          expect(console.error).toHaveBeenCalledTimes(1);
          expect(console.error).toHaveBeenCalledWith(`socket error: ${err}`);
        });
      });
    });
  });

  describe("shutdown", () => {
    it("should call io.close", () => {
      const shutdown = require("../../index");
      shutdown();

      expect(io.close).toHaveBeenCalledTimes(1);
    });
  });

  describe("on unhandled rejection", () => {
    let onUnhandledException, e;
    beforeEach(() => {
      e = new Error("An unhandled rejection");
      require("../../index");
      onUnhandledException = process.on.mock.calls[0][1];
      onUnhandledException(e);
    });

    it("should listen for unhandled promise rejections", () => {
      expect(process.on).toHaveBeenCalledWith("unhandledRejection", expect.any(Function));
    });

    it("should log the error", () => {
      expect(console.error).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledWith("unhandled promise rejection", e);
    });

    it("should exit with a return code of 1", () => {
      expect(process.exitCode).toBe(1);
    });
  });
});
