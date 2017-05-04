import utils from '../../utils';
import getSessionFixtures from '../../fixtures/session';
import start from '../../../../index';
import { waitForRequests } from '../../../../api-request';

describe('session route', () => {
  let socket, sessionFixtures, stubDaddy, shutdown, messageName;

  beforeEach(() => {
    messageName = 'message1';
    sessionFixtures = getSessionFixtures();
  });

  beforeEach(() => {
    stubDaddy = utils.getStubDaddy();

    stubDaddy.webService.startService();
  });

  beforeEach(() => {
    shutdown = start();
    socket = utils.getSocket({
      cookie: 'io=-IN8P0JaX0yivaedAAAB; csrftoken=V7ZKtwh29dlG4t1jkqJjIrMj6wH4kF1A; sessionid=99ba2e792a\
915d0648a714b526d00736'
    });
  });

  afterEach(done => {
    stubDaddy.webService.stopService(done.fail, done);
  });

  afterEach(() => {
    stubDaddy.inlineService.mockState();
  });

  afterEach(() => {
    shutdown();
  });

  afterEach(done => {
    waitForRequests(done);
  });

  afterEach(done => {
    socket.on('disconnect', done);
    socket.close();
  });

  describe('post session', () => {
    let postSpy;
    beforeEach(done => {
      postSpy = jasmine.createSpy('postSpy');

      stubDaddy.inlineService.mock(sessionFixtures.login);

      socket.emit(
        messageName,
        {
          path: '/session',
          options: {
            method: 'post',
            json: {
              username: 'billybones',
              password: 'abc123'
            },
            headers: {
              cookie: 'io=-IN8P0JaX0yivaedAAAB; csrftoken=V7ZKtwh29dlG4t1jkqJjIrMj6wH4kF1A; sessionid=99ba2e792a\
915d0648a714b526d00736'
            }
          }
        },
        data => {
          postSpy(data);
          done();
        }
      );
    });

    it('should post the session and return the set-cookie header', () => {
      expect(postSpy).toHaveBeenCalledOnceWith(
        'sessionid=63e4f9bcd405614ca94aaf6c46f8ff64; expires=Tue, \
15-Nov-2016 14:39:41 GMT; Max-Age=1209600; Path=/'
      );
    });
  });

  describe('delete session', () => {
    let deleteSpy;
    beforeEach(done => {
      deleteSpy = jasmine.createSpy('deleteSpy');

      stubDaddy.inlineService.mock(sessionFixtures.delete);

      socket.emit(
        messageName,
        {
          path: '/session',
          options: {
            method: 'delete',
            headers: {
              cookie: 'csrftoken=yJisbQFz9IhO9bRQ9ZLXpIf5mZboQXv3; sessionid=d8f0c4fa6febfa5b95be4a43ad72d7c2'
            }
          }
        },
        data => {
          deleteSpy(data);
          done();
        }
      );
    });

    it('should post the session and return the set-cookie header', () => {
      expect(deleteSpy).toHaveBeenCalledOnceWith(
        'sessionid=1487791a56bd72d1b00fe4e3588cac66; expires=Fri, 18-Nov-2016 18:10:58 GMT; Max-Age=1209600; Path=/'
      );
    });
  });
});
