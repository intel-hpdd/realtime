"use strict";

describe("realtime index test", () => {
  var mockCreateIo,
    io,
    mockConf,
    revert,
    logger,
    mockLogger,
    socket,
    data,
    ack,
    mockRequestValidator,
    mockSocketRouter,
    mockSerializeError,
    mockEventWildcard,
    mockStart,
    start;

  describe("setup events", () => {
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

      logger = {
        info: jest.fn(),
        error: jest.fn()
      };

      mockLogger = {
        child: jest.fn(() => logger)
      };

      socket = {
        on: jest.fn(),
        emit: jest.fn(),
        write: jest.fn()
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

      jest.mock("../../conf", () => mockConf);
      jest.mock("socket.io", () => mockCreateIo);
      jest.mock("../../logger", () => mockLogger);
      jest.mock("../../request-validator", () => mockRequestValidator);
      jest.mock("../../socket-router", () => mockSocketRouter);
      jest.mock("../../serialize-error", () => mockSerializeError);
      jest.mock("../../event-wildcard", () => mockEventWildcard);

      start = require("../../index");
    });

    it("should register the eventWildcard plugin", () => {
      start();
      expect(io.use).toHaveBeenCalledTimes(1);
      expect(io.use).toHaveBeenCalledWith(mockEventWildcard);
    });

    it("should call createIo", () => {
      start();
      expect(mockCreateIo).toHaveBeenCalledTimes(1);
    });

    it("should call io.attach with the realtime port", () => {
      start();
      expect(io.attach).toHaveBeenCalledTimes(1);
      expect(io.attach).toHaveBeenCalledWith(mockConf.REALTIME_PORT, { wsEngine: "uws" });
    });

    it("should register a connection event handler on io", () => {
      start();
      expect(io.on).toHaveBeenCalledTimes(1);
      expect(io.on).toHaveBeenCalledWith("connection", expect.any(Function));
    });

    describe("on io", () => {
      beforeEach(() => {
        io.on.mockImplementation((evt, fn) => {
          if (evt === "connection") fn(socket);
        });
      });

      describe("connection event", () => {
        it("should register the socket wildcard event", () => {
          start();
          expect(socket.on).toHaveBeenCalledTimes(2);
          expect(socket.on).toHaveBeenCalledWith("*", expect.any(Function));
        });

        describe("on socket wildcard", () => {
          beforeEach(() => {
            socket.on.mockImplementation((evt, fn) => {
              if (evt === "*") fn(data, ack);
            });
          });

          describe("success", () => {
            beforeEach(() => {
              mockRequestValidator.mockReturnValue([]);
            });

            it("should call requestValidator", () => {
              start();
              expect(mockRequestValidator).toHaveBeenCalledTimes(1);
              expect(mockRequestValidator).toHaveBeenCalledWith(data);
            });

            it("should call socketRouter with the appropriate data", () => {
              start();
              expect(mockSocketRouter.go).toHaveBeenCalledTimes(1);
              expect(mockSocketRouter.go).toHaveBeenCalledWith(
                data.path,
                {
                  verb: data.method,
                  data: {
                    qs: {}
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
            var error, serializedError;
            beforeEach(() => {
              error = "something bad happened";
              serializedError = "serialized error";
              mockSerializeError.mockReturnValue(serializedError);
              mockRequestValidator.mockReturnValue(error);
            });

            describe("with ack", () => {
              it("should ack the error", () => {
                start();
                expect(ack).toHaveBeenCalledTimes(1);
                expect(ack).toHaveBeenCalledWith(serializedError);
              });
            });

            describe("without ack", () => {
              it("should call socket.emit to the message with the error", () => {
                ack = null;
                start();
                expect(socket.emit).toHaveBeenCalledTimes(1);
                expect(socket.emit).toHaveBeenCalledWith("message1", serializedError);
              });
            });
          });
        });

        it("should register the socket error event", () => {
          start();
          expect(socket.on).toHaveBeenCalledTimes(2);
          expect(socket.on).toHaveBeenCalledWith("error", expect.any(Function));
        });

        describe("on socket error", () => {
          var err;
          beforeEach(() => {
            err = new Error("something bad happend");
            socket.on.mockImplementation((evt, fn) => {
              if (evt === "error") fn(err);
            });
          });

          it("should log the error", () => {
            start();
            expect(logger.error).toHaveBeenCalledTimes(1);
            expect(logger.error).toHaveBeenCalledWith({ err: err }, "socket error");
          });
        });
      });
    });

    describe("shutdown", () => {
      it("should call io.close", () => {
        var shutdown = start();
        shutdown();

        expect(io.close).toHaveBeenCalledTimes(1);
      });
    });
  });
});
