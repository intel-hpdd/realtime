var rewire = require('rewire');
var end = rewire('../../../../socket-router/middleware/end');

describe('end spec', function () {
  var logger, next, req, resp, revert, stream, onDestroy;

  beforeEach(function () {
    logger = {
      info: jasmine.createSpy('info')
    };

    revert = end.__set__('logger', logger);

    next = jasmine.createSpy('next');

    req = { matches: ['foo'] };

    resp = {
      socket: {
        once: jasmine.createSpy('once')
      }
    };

    stream = {
      destroy: jasmine.createSpy('destroy')
    };

    end(req, resp, stream, next);

    onDestroy = resp.socket.once.calls.mostRecent().args[1];
  });

  afterEach(function () {
    revert();
  });

  it('should call next with the request and response', function () {
    expect(next).toHaveBeenCalledOnceWith(req, resp);
  });

  it('should not call destroy if nil was seen', function () {
    stream._nil_seen = true;

    onDestroy();

    expect(stream.destroy).not.toHaveBeenCalled();
  });

  it('should not call destroy if stream was ended', function () {
    stream.ended = true;

    onDestroy();

    expect(stream.destroy).not.toHaveBeenCalled();
  });

  it('should not call destroy twice', function () {
    onDestroy();
    onDestroy();

    expect(stream.destroy).toHaveBeenCalledOnce();
  });
});
