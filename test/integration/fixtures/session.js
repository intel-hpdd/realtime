'use strict';

module.exports = function () {
  return {
    login: {
      request: {
        method: 'POST',
        url: '/api/session',
        data: {
          username: 'billybones',
          password: 'abc123'
        },
        headers: {
          cookie: 'cookie: io=-IN8P0JaX0yivaedAAAB; csrftoken=V7ZKtwh29dlG4t1jkqJjIrMj6wH4kF1A; sessionid=99ba2e792a91\
5d0648a714b526d00736'
        }
      },
      response: {
        statusCode: 201,
        headers: {
          'set-cookie': ['sessionid=63e4f9bcd405614ca94aaf6c46f8ff64; expires=Tue, 15-Nov-2016 14:39:41 GMT; Max-Age=\
1209600; Path=/']
        },
        data: {}
      },
      dependencies: [],
      expires: 1
    },
    getSession: {
      request: {
        method: 'GET',
        url: '/api/session',
        data: {},
        headers: {}
      },
      response: {
        statusCode: 200,
        headers: {
          'set-cookie': [
            'csrftoken=V7ZKtwh29dlG4t1jkqJjIrMj6wH4kF1A; expires=Tue, 31-Oct-2017 17:48:31 GMT; Max-Age=31449600; \
Path=/',
            'sessionid=de13d302bd5f97345f9f4cf393a6a759; expires=Tue, 15-Nov-2016 17:48:31 GMT; Max-Age=1209600; Path=/'
          ]
        },
        data: {
          read_enabled: true,
          resource_uri: '/api/session/',
          user: {
            accepted_eula: true,
            alert_subscriptions: [],
            email: 'admin@debug.co.eh',
            eula_state: 'pass',
            first_name: '',
            full_name: '',
            groups: [
              {
                id: '1',
                name: 'superusers',
                resource_uri: '/api/group/1/'
              }
            ],
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
        }
      },
      dependencies: [],
      expires: 0
    }
  };
};
