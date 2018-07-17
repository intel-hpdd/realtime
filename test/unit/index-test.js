"use strict";

var rewire = require("rewire");
var start = rewire("../../index");

describe("realtime index test", function() {
  var createIo,
    io,
    conf,
    revert,
    logger,
    socket,
    data,
    ack,
    requestValidator,
    socketRouter,
    serializeError,
    eventWildcard;

  describe("setup events", function() {
    beforeEach(function() {
      conf = {
        REALTIME_PORT: 8888
      };

      io = {
        attach: jasmine.createSpy("attach"),
        on: jasmine.createSpy("on"),
        close: jasmine.createSpy("close"),
        use: jasmine.createSpy("use")
      };

      createIo = jasmine.createSpy("createIo").and.returnValue(io);

      logger = {
        info: jasmine.createSpy("debug"),
        error: jasmine.createSpy("error")
      };

      logger.child = jasmine.createSpy("child").and.returnValue(logger);

      socket = {
        on: jasmine.createSpy("socket.on"),
        emit: jasmine.createSpy("emit"),
        write: jasmine.createSpy("write")
      };

      data = {
        options: {},
        path: "/api/alert/",
        method: "get",
        eventName: "message1"
      };

      ack = jasmine.createSpy("ack");

      socketRouter = {
        go: jasmine.createSpy("socketRouter")
      };

      requestValidator = jasmine.createSpy("requestValidator");

      serializeError = jasmine.createSpy("serializeError");

      eventWildcard = jasmine.createSpy("eventWildcard");

      revert = start.__set__({
        conf: conf,
        createIo: createIo,
        logger: logger,
        requestValidator: requestValidator,
        socketRouter: socketRouter,
        serializeError: serializeError,
        eventWildcard: eventWildcard
      });
    });

    afterEach(function() {
      revert();
    });

    it("should register the eventWildcard plugin", function() {
      start();
      expect(io.use).toHaveBeenCalledTimes(1);
      expect(io.use).toHaveBeenCalledWith(eventWildcard);
    });

    it("should call createIo", function() {
      start();
      expect(createIo).toHaveBeenCalledTimes(1);
    });

    it("should call io.attach with the realtime port", function() {
      start();
      expect(io.attach).toHaveBeenCalledTimes(1);
      expect(io.attach).toHaveBeenCalledWith(conf.REALTIME_PORT, { wsEngine: "uws" });
    });

    it("should register a connection event handler on io", function() {
      start();
      expect(io.on).toHaveBeenCalledTimes(1);
      expect(io.on).toHaveBeenCalledWith("connection", jasmine.any(Function));
    });

    describe("on io", function() {
      beforeEach(function() {
        io.on.and.callFake(function(evt, fn) {
          if (evt === "connection") fn(socket);
        });
      });

      describe("connection event", function() {
        it("should register the socket wildcard event", function() {
          start();
          expect(socket.on).toHaveBeenCalledTimes(2);
          expect(socket.on).toHaveBeenCalledWith("*", jasmine.any(Function));
        });

        describe("on socket wildcard", function() {
          beforeEach(function() {
            socket.on.and.callFake(function(evt, fn) {
              if (evt === "*") fn(data, ack);
            });
          });

          describe("success", function() {
            beforeEach(function() {
              requestValidator.and.returnValue([]);
            });

            it("should call requestValidator", function() {
              start();
              expect(requestValidator).toHaveBeenCalledTimes(1);
              expect(requestValidator).toHaveBeenCalledWith(data);
            });

            it("should call socketRouter with the appropriate data", function() {
              start();
              expect(socketRouter.go).toHaveBeenCalledTimes(1);
              expect(socketRouter.go).toHaveBeenCalledWith(
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
                  ack: jasmine.any(Function)
                }
              );
            });
          });

          describe("error", function() {
            var error, serializedError;
            beforeEach(function() {
              error = "something bad happened";
              serializedError = "serialized error";
              serializeError.and.returnValue(serializedError);
              requestValidator.and.returnValue(error);
            });

            describe("with ack", function() {
              it("should ack the error", function() {
                start();
                expect(ack).toHaveBeenCalledTimes(1);
                expect(ack).toHaveBeenCalledWith(serializedError);
              });
            });

            describe("without ack", function() {
              it("should call socket.emit to the message with the error", function() {
                ack = null;
                start();
                expect(socket.emit).toHaveBeenCalledTimes(1);
                expect(socket.emit).toHaveBeenCalledWith("message1", serializedError);
              });
            });
          });
        });

        it("should register the socket error event", function() {
          start();
          expect(socket.on).toHaveBeenCalledTimes(2);
          expect(socket.on).toHaveBeenCalledWith("error", jasmine.any(Function));
        });

        describe("on socket error", function() {
          var err;
          beforeEach(function() {
            err = new Error("something bad happend");
            socket.on.and.callFake(function(evt, fn) {
              if (evt === "error") fn(err);
            });
          });

          it("should log the error", function() {
            start();
            expect(logger.error).toHaveBeenCalledTimes(1);
            expect(logger.error).toHaveBeenCalledWith({ err: err }, "socket error");
          });
        });
      });
    });

    describe("shutdown", function() {
      it("should call io.close", function() {
        var shutdown = start();
        shutdown();

        expect(io.close).toHaveBeenCalledTimes(1);
      });
    });
  });
});
