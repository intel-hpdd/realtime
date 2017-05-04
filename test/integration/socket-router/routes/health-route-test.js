import utils from '../../utils';
import getAlertFixtures from '../../fixtures/alert';
import start from '../../../../index';
import { waitForRequests } from '../../../../api-request';
import * as obj from '@mfl/obj';

describe('health route', function() {
  let socket,
    stubDaddy,
    alertFixtures,
    shutdown,
    messageName,
    emitMessage,
    onceMessage,
    onMessage;

  beforeEach(function() {
    messageName = 'message1';
    alertFixtures = getAlertFixtures();
  });

  beforeEach(function() {
    stubDaddy = utils.getStubDaddy();

    stubDaddy.webService.startService();
  });

  beforeEach(function() {
    shutdown = start();
    socket = utils.getSocket();
    emitMessage = socket.emit.bind(socket, messageName, { path: '/health' });
    onceMessage = socket.once.bind(socket, messageName);
    onMessage = socket.on.bind(socket, messageName);
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

  describe('no alerts', function() {
    beforeEach(function() {
      stubDaddy.inlineService.mock(alertFixtures.greenHealth);
    });

    it('should return good health', function(done) {
      emitMessage();
      onceMessage(function(data) {
        expect(data.health).toBe('GOOD');
        done();
      });
    });

    it('should return a count of alerts', function(done) {
      emitMessage();
      onceMessage(function(data) {
        expect(data.count).toEqual(0);
        done();
      });
    });
  });

  describe('warning alerts', function() {
    beforeEach(function() {
      stubDaddy.inlineService.mock(alertFixtures.yellowHealth);
    });

    it('should return warning health', function(done) {
      emitMessage();

      onceMessage(function(data) {
        expect(data.health).toBe('WARNING');
        done();
      });
    });

    it('should return a count of alerts', function(done) {
      emitMessage();

      onceMessage(function(data) {
        expect(data.count).toEqual(1);
        done();
      });
    });
  });

  describe('error alerts', function() {
    beforeEach(function() {
      stubDaddy.inlineService.mock(alertFixtures.redHealth);
    });

    it('should return error health', function(done) {
      emitMessage();

      onceMessage(function(data) {
        expect(data.health).toBe('ERROR');
        done();
      });
    });

    it('should return a count of alerts', function(done) {
      emitMessage();

      onceMessage(function(data) {
        expect(data.count).toEqual(1);
        done();
      });
    });
  });

  describe('warning + error alerts', function() {
    beforeEach(function() {
      alertFixtures.redHealth.response.data.objects.splice(
        1,
        0,
        alertFixtures.yellowHealth.response.data.objects[0]
      );

      stubDaddy.inlineService.mock(alertFixtures.redHealth);
    });

    it('should return error health', function(done) {
      emitMessage();

      onceMessage(function(data) {
        expect(data.health).toBe('ERROR');
        done();
      });
    });

    it('should return a count of alerts', function(done) {
      emitMessage();

      onceMessage(function(data) {
        expect(data.count).toEqual(2);
        done();
      });
    });
  });

  it('should send two responses', function(done) {
    const greenHealth = utils.clone(alertFixtures.greenHealth);
    greenHealth.expires = 1;

    stubDaddy.inlineService.mock(greenHealth);

    stubDaddy.inlineService.mock(alertFixtures.yellowHealth);

    const messages = [];

    emitMessage();

    onMessage(function(data) {
      messages.push(data);

      if (messages.length === 2) {
        expect(messages).toEqual([
          { health: 'GOOD', count: 0 },
          { health: 'WARNING', count: 1 }
        ]);
        done();
      }
    });
  });

  it('should send a change in count', function(done) {
    const yellowHealth1 = obj.clone(alertFixtures.yellowHealth);
    yellowHealth1.response.data.objects.push(
      obj.clone(yellowHealth1.response.data.objects[0])
    );
    yellowHealth1.expires = 1;
    stubDaddy.inlineService.mock(yellowHealth1);

    const yellowHealth2 = utils.clone(alertFixtures.yellowHealth);
    stubDaddy.inlineService.mock(yellowHealth2);

    const messages = [];

    emitMessage();

    onMessage(function(data) {
      messages.push(data);

      if (messages.length === 2) {
        expect(messages).toEqual([
          { health: 'WARNING', count: 2 },
          { health: 'WARNING', count: 1 }
        ]);
        done();
      }
    });
  });

  describe('handling error', function() {
    let redHealth;

    beforeEach(function() {
      redHealth = utils.clone(alertFixtures.redHealth);
      redHealth.response.statusCode = 500;
      redHealth.response.data = { err: 'boom!' };

      stubDaddy.inlineService.mock(redHealth);

      emitMessage();
    });

    it('should send error', function(done) {
      onceMessage(function(data) {
        expect(data).toEqual({
          error: {
            name: 'Error',
            message: '{"err":"boom!"} From GET request to ' +
              '/api/alert/?active=true&severity__in=WARNING&severity__in=ERROR&limit=0',
            stack: jasmine.any(String),
            statusCode: 500
          }
        });
        done();
      });
    });
  });
});
