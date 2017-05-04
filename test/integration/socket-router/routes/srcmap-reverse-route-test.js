var utils = require('../../utils');
var start = require('../../../../index');
var clientErrorFixtures = require('../../fixtures/client-error');
var waitForRequests = require('../../../../api-request').waitForRequests;

describe('source map reverse route', function () {
  var ack, socket, shutdown, stubDaddy;

  beforeEach(function () {
    stubDaddy = utils.getStubDaddy();

    stubDaddy.webService
      .startService();
  });

  beforeEach(function () {
    stubDaddy.inlineService
      .mock(clientErrorFixtures().reversedTrace);
  });

  beforeEach(function (done) {
    shutdown = start();
    socket = utils.getSocket();

    ack = jasmine.createSpy('ack');
    socket.emit('message1', clientErrorFixtures().originalTrace, function (x) {
      ack(x);
      done();
    });
  });

  beforeEach(function (done) {
    var timer = setInterval(function () {
      if (stubDaddy.inlineService.registeredMocks().data.length === 0) {
        clearInterval(timer);
        done();
      }
    }, 100);
  });

  afterEach(function (done) {
    stubDaddy.webService
      .stopService(done.fail, done);
  });

  afterEach(function () {
    stubDaddy.inlineService.mockState();
  });

  afterEach(function () {
    shutdown();
  });

  afterEach(function (done) {
    waitForRequests(done);
  });

  afterEach(function (done) {
    socket.on('disconnect', done);
    socket.close();
  });

  it('should reverse a trace', function () {
    expect(ack).toHaveBeenCalledOnceWith({
      data: clientErrorFixtures().reversedTrace.request.data.stack
    });
  });
});
