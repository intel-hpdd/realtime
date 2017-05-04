import utils from '../../utils';
import getAlertFixtures from '../../fixtures/alert';
import start from '../../../../index';
import { waitForRequests } from '../../../../api-request';
import * as fp from '@mfl/fp';

describe('wildcard route', function() {
  let socket,
    stubDaddy,
    alertFixtures,
    alertRequest,
    shutdown,
    emitMessage,
    onceMessage;

  beforeEach(function() {
    alertFixtures = getAlertFixtures();

    alertRequest = {
      path: '/alert',
      options: {
        qs: {
          active: 'true',
          severity__in: ['WARNING', 'ERROR'],
          limit: 0
        }
      }
    };
  });

  beforeEach(function() {
    stubDaddy = utils.getStubDaddy();

    stubDaddy.webService.startService();
  });

  beforeEach(function() {
    shutdown = start();
    socket = utils.getSocket();
    emitMessage = socket.emit.bind(socket, 'message1');
    onceMessage = socket.once.bind(socket, 'message1');
  });

  afterEach(function(done) {
    stubDaddy.webService.stopService(done.fail, done);
  });

  afterEach(function() {
    stubDaddy.inlineService.mockState();
  });

  afterEach(function() {
    shutdown();
  });

  afterEach(function(done) {
    waitForRequests(done);
  });

  afterEach(function(done) {
    socket.on('disconnect', done);
    socket.close();
  });

  describe('handling response', function() {
    beforeEach(function() {
      stubDaddy.inlineService.mock(alertFixtures.yellowHealth);
    });

    it('should provide an ack', function(done) {
      emitMessage(alertRequest, function ack(resp) {
        expect(resp).toEqual(alertFixtures.yellowHealth.response.data);
        done();
      });
    });

    it('should provide an event', function(done) {
      emitMessage(alertRequest);
      onceMessage(function onData(resp) {
        expect(resp).toEqual(alertFixtures.yellowHealth.response.data);
        done();
      });
    });

    describe('handling post with json-mask', function() {
      describe('on a valid match', function() {
        beforeEach(function() {
          alertRequest.options.jsonMask = 'objects/(id,active)';
        });

        it('should filter the response to only the parameters specified in the json mask', function(
          done
        ) {
          emitMessage(alertRequest, function ack(resp) {
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

      describe('on an invalid match', function() {
        beforeEach(function() {
          alertRequest.options.jsonMask = 'objects/(invalid)';
        });

        it('should throw an exception', function(done) {
          emitMessage(alertRequest, function ack(resp) {
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

  describe('handling errors', function() {
    let spy;
    beforeEach(function() {
      spy = jasmine.createSpy('spy');
      stubDaddy.inlineService.mock({
        request: {
          method: 'GET',
          url: '/api/throw-error/',
          data: {},
          headers: {}
        },
        response: {
          statusCode: 500,
          headers: {},
          data: {
            err: { cause: 'boom!' }
          }
        },
        expires: 0,
        dependencies: []
      });
    });

    describe('acking the error', function() {
      beforeEach(function(done) {
        emitMessage(
          { path: '/throw-error' },
          fp.flow(spy, fp.always([]), fp.invoke(done))
        );
      });

      it('should receive a 500', function() {
        expect(spy).toHaveBeenCalledWith({
          error: {
            message: '{"err":{"cause":"boom!"}} From GET request to /api/throw-error/',
            name: 'Error',
            stack: jasmine.any(String),
            statusCode: 500
          }
        });
      });
    });

    describe('sending an error through events', function() {
      beforeEach(function(done) {
        emitMessage({ path: '/throw-error' });
        onceMessage(fp.flow(spy, fp.always([]), fp.invoke(done)));
      });

      it('should receive a 500', function() {
        expect(spy).toHaveBeenCalledOnceWith({
          error: {
            message: '{"err":{"cause":"boom!"}} From GET request to /api/throw-error/',
            name: 'Error',
            stack: jasmine.any(String),
            statusCode: 500
          }
        });
      });
    });
  });

  it('should long poll the host endpoint', function(done) {
    stubDaddy.inlineService.mock({
      request: {
        method: 'GET',
        url: '/api/host/1/',
        data: {},
        headers: {}
      },
      response: {
        statusCode: 200,
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
    onceMessage(function onData(resp) {
      expect(resp).toEqual({
        objects: []
      });
      done();
    });
  });

  it('should re-poll with a 304', function(done) {
    stubDaddy.inlineService.mock({
      request: {
        method: 'GET',
        url: '/api/host/',
        data: {},
        headers: {}
      },
      response: {
        statusCode: 304,
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
        headers: {}
      },
      response: {
        statusCode: 200,
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

    stubDaddy.inlineService.mock({
      request: {
        method: 'GET',
        url: '/api/host/',
        data: {},
        headers: {
          'if-none-match': 1441818174.99
        }
      },
      response: {
        statusCode: 200,
        headers: {},
        data: {
          objects: []
        }
      },
      dependencies: [],
      timeout: 10000,
      expires: -1
    });

    emitMessage({
      path: '/host',
      options: {}
    });
    onceMessage(function onData(resp) {
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
