'use strict';

var utils = require('../../utils');
var getAlertFixtures = require('../../fixtures/alert');
var start = require('../../../../index');
var waitForRequests = require('../../../../api-request').waitForRequests;

describe('wildcard route', function () {
  var socket, stubDaddy,
    alertFixtures, alertRequest,
    shutdown, emitMessage, onceMessage;

  beforeEach(function () {
    alertFixtures = getAlertFixtures();

    alertRequest = {
      path: '/alert',
      options: {
        qs: {
          active: 'true',
          severity__in: [
            'WARNING',
            'ERROR'
          ],
          limit: 0
        }
      }
    };
  });

  beforeEach(function (done) {
    stubDaddy = utils.getStubDaddy();

    stubDaddy.webService
      .startService()
      .done(done, done.fail);
  });

  beforeEach(function () {
    shutdown = start();
    socket = utils.getSocket();
    emitMessage = socket.emit.bind(socket, 'message1');
    onceMessage = socket.once.bind(socket, 'message1');
  });

  afterEach(function (done) {
    stubDaddy.webService
      .stopService()
      .done(done, done.fail);
  });

  afterEach(function () {
    var result = stubDaddy.inlineService
      .mockState();

    if (result.status !== 200)
      throw new Error(JSON.stringify(result.data, null, 2));
  });

  afterEach(function () {
    shutdown();
  });

  afterEach(waitForRequests);

  afterEach(function (done) {
    socket.on('disconnect', done);
    socket.close();
  });

  describe('handling response', function () {
    beforeEach(function () {
      stubDaddy.inlineService.mock(alertFixtures.yellowHealth);
    });

    it('should provide an ack', function (done) {
      emitMessage(alertRequest, function ack (resp) {
        expect(resp).toEqual(alertFixtures.yellowHealth.response.data);
        done();
      });
    });

    it('should provide an event', function (done) {
      emitMessage(alertRequest);
      onceMessage(function onData (resp) {
        expect(resp).toEqual(alertFixtures.yellowHealth.response.data);
        done();
      });
    });

    describe('handling post with json-mask', function () {
      describe('on a valid match', function () {
        beforeEach(function () {
          alertRequest.options.jsonMask = 'objects/(id,active)';
        });

        it('should filter the response to only the parameters specified in the json mask', function (done) {
          emitMessage(alertRequest, function ack (resp) {
            expect(resp).toEqual({
              objects: [
                {
                  id: '2',
                  active: false
                }
              ]
            });

            done();
          });
        });
      });

      describe('on an invalid match', function () {
        beforeEach(function () {
          alertRequest.options.jsonMask = 'objects/(invalid)';
        });

        it('should throw an exception', function (done) {
          emitMessage(alertRequest, function ack (resp) {
            expect(resp).toEqual({
              error: {
                message: 'The json mask did not match the response and as a result returned null. Examine the mask: ' +
                '"objects/(invalid)" From GET request to ' +
                '/api/alert/?active=true&severity__in=WARNING&severity__in=ERROR&limit=0',
                name: 'Error',
                stack: jasmine.any(String),
                statusCode: 400
              }
            });
            done();
          });
        });
      });
    });
  });

  describe('handling errors', function () {
    beforeEach(function () {
      stubDaddy.inlineService.mock({
        request: {
          method: 'GET',
          url: '/api/throw-error/',
          data: {},
          headers: {}
        },
        response: {
          status: 500,
          headers: {},
          data: {
            err: { cause: 'boom!' }
          }
        },
        expires: 0,
        dependencies: []
      });
    });

    it('should ack an error', function (done) {
      emitMessage({ path: '/throw-error' }, function ack (resp) {
        expect(resp).toEqual({
          error: {
            message: '{"err":{"cause":"boom!"}} From GET request to /api/throw-error/',
            name: 'Error',
            stack: jasmine.any(String),
            statusCode: 500
          }
        });
        done();
      });
    });

    it('should send an error through events', function (done) {
      emitMessage({ path: '/throw-error' });
      onceMessage(function onData (resp) {
        expect(resp).toEqual({
          error: {
            message: '{"err":{"cause":"boom!"}} From GET request to /api/throw-error/',
            name: 'Error',
            stack: jasmine.any(String),
            statusCode: 500
          }
        });
        done();
      });
    });
  });

  it('should long poll the host endpoint', function (done) {
    stubDaddy.inlineService.mock({
      request: {
        method: 'GET',
        url: '/api/host/1/',
        data: {},
        headers: {
          'if-none-match': '0'
        }
      },
      response: {
        status: 200,
        headers: {
          ETag: 1441818174.97
        },
        data: {
          objects: []
        }
      },
      dependencies: [],
      expires: 0
    });

    emitMessage({ path: '/host/1/' });
    onceMessage(function onData (resp) {
      expect(resp).toEqual({
        objects: []
      });
      done();
    });
  });

  it('should re-poll with a 304', function (done) {
    stubDaddy.inlineService.mock({
      request: {
        method: 'GET',
        url: '/api/host/',
        data: {},
        headers: {
          'if-none-match': '1441818174.97'
        }
      },
      response: {
        status: 304,
        headers: {},
        data: {
          objects: []
        }
      },
      dependencies: [],
      expires: 1
    });

    stubDaddy.inlineService.mock({
      request: {
        method: 'GET',
        url: '/api/host/',
        data: {},
        headers: {
          'if-none-match': '1441818174.97'
        }
      },
      response: {
        status: 200,
        headers: {
          ETag: 1441818174.99
        },
        data: {
          objects: [
            {
              foo: 'bar'
            }
          ]
        }
      },
      dependencies: [],
      expires: 1
    });

    emitMessage({
      path: '/host',
      options: {
        headers: {
          'If-None-Match': 1441818174.97
        }
      }
    });
    onceMessage(function onData (resp) {
      expect(resp).toEqual({
        objects: [
          {
            foo: 'bar'
          }
        ]
      });
      done();
    });
  });
});
