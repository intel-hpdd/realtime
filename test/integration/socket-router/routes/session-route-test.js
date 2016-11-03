'use strict';

var utils = require('../../utils');
var getSessionFixtures = require('../../fixtures/session');
var start = require('../../../../index');
var waitForRequests = require('../../../../api-request').waitForRequests;

describe('session route', function () {
  var socket, sessionFixtures, stubDaddy, shutdown, messageName;

  beforeEach(function () {
    messageName = 'message1';
    sessionFixtures = getSessionFixtures();
  });

  beforeEach(function () {
    stubDaddy = utils.getStubDaddy();

    stubDaddy.webService
      .startService();
  });

  beforeEach(function () {
    shutdown = start();
    socket = utils.getSocket();
  });

  afterEach(function (done) {
    stubDaddy.webService
      .stopService(done.fail, done);
  });

  afterEach(function () {
    stubDaddy.inlineService
      .mockState();
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

  describe('post session', function () {
    var postSpy;
    beforeEach(function (done) {
      postSpy = jasmine.createSpy('postSpy');

      stubDaddy.inlineService
        .mock(sessionFixtures.login);

      socket.emit(messageName, {
        path: '/session',
        options: {
          method: 'post',
          json: {
            username: 'billybones',
            password: 'abc123'
          },
          headers: {
            cookie: 'cookie: io=-IN8P0JaX0yivaedAAAB; csrftoken=V7ZKtwh29dlG4t1jkqJjIrMj6wH4kF1A; sessionid=99ba2e792a\
915d0648a714b526d00736'
          }
        }
      }, function ack (data) {
        postSpy(data);
        done();
      });
    });

    it('should post the session and return the set-cookie header', function () {
      expect(postSpy).toHaveBeenCalledOnceWith(
        'sessionid=63e4f9bcd405614ca94aaf6c46f8ff64; expires=Tue, 15-Nov-2016 14:39:41 GMT; Max-Age=1209600; Path=/'
      );
    });

    describe('get session', function () {
      var bodySpy;
      beforeEach(function (done) {
        bodySpy = jasmine.createSpy('bodySpy');
        stubDaddy.inlineService
          .mock(sessionFixtures.getSession);

        socket.emit(messageName, {
          path: '/session',
          options: {
            method: 'get'
          }
        }, function ack (data) {
          bodySpy(data);
          done();
        });
      });

      it('should return the body', function () {
        expect(bodySpy).toHaveBeenCalledOnceWith({
          read_enabled: true,
          resource_uri: '/api/session/',
          user: {
            accepted_eula: true,
            alert_subscriptions: [],
            email: 'admin@debug.co.eh',
            eula_state: 'pass',
            first_name: '',
            full_name: '',
            groups: [{
              id: '1',
              name: 'superusers',
              resource_uri: '/api/group/1/'
            }],
            gui_config: {},
            id: '1',
            is_superuser: true,
            last_name: '',
            new_password1: null,
            new_password2: null,
            password1: null,
            password2: null,
            resource_uri: '/api/user/1/',
            username: 'admin'
          }
        });
      });
    });
  });
});
