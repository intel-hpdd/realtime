"use strict";

describe("event wildcard", () => {
  let emit, socket, acker, next, mockEvents, eventWildcard;

  beforeEach(() => {
    emit = {
      apply: jest.fn()
    };

    mockEvents = {
      EventEmitter: {
        prototype: {
          emit
        }
      }
    };
    jest.mock("events", () => mockEvents);

    acker = {};

    eventWildcard = require("../../event-wildcard");

    socket = {
      ack: jest.fn(() => acker)
    };

    next = jest.fn();

    eventWildcard(socket, next);
  });

  it("should call next", () => {
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("should override socket.onevent", () => {
    expect(socket.onevent).toEqual(expect.any(Function));
  });

  describe("socket.onevent", () => {
    let packet;

    beforeEach(() => {
      packet = {};
    });

    it("should default to empty data", () => {
      socket.onevent(packet);

      expect(emit.apply).toHaveBeenCalledTimes(2);
      expect(emit.apply).toHaveBeenCalledWith(socket, []);
    });

    it("should call wildcard with empty data", () => {
      socket.onevent(packet);

      expect(emit.apply).toHaveBeenCalledTimes(2);
      expect(emit.apply).toHaveBeenCalledWith(socket, ["*", { eventName: undefined }]);
    });

    it("should push an ack if there is a packet.id", () => {
      packet.id = 2;
      packet.data = ["name", {}];
      socket.onevent(packet);

      expect(socket.ack).toHaveBeenCalledTimes(1);
      expect(socket.ack).toHaveBeenCalledWith(packet.id);
    });

    it("should emit the args", () => {
      packet.data = ["name", {}];
      socket.onevent(packet);

      expect(emit.apply).toHaveBeenCalledTimes(2);
      expect(emit.apply).toHaveBeenCalledWith(socket, ["name", {}]);
    });

    it("should emit wildcard args", () => {
      packet.data = ["name", { foo: "bar" }];
      socket.onevent(packet);

      expect(emit.apply).toHaveBeenCalledTimes(2);
      expect(emit.apply).toHaveBeenCalledWith(socket, ["*", { foo: "bar", eventName: "name" }]);
    });
  });
});
