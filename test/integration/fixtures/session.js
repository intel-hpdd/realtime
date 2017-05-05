export default () => ({
  login: {
    request: {
      method: 'POST',
      url: '/api/session',
      data: {
        username: 'billybones',
        password: 'abc123'
      },
      headers: {
        cookie: 'io=-IN8P0JaX0yivaedAAAB; csrftoken=V7ZKtwh29dlG4t1jkqJjIrMj6wH4kF1A; sessionid=99ba2e792a91\
5d0648a714b526d00736'
      }
    },
    response: {
      statusCode: 201,
      headers: {
        'set-cookie': [
          'sessionid=63e4f9bcd405614ca94aaf6c46f8ff64; expires=Tue, 15-Nov-2016 14:39:41 GMT; Max-Age=\
1209600; Path=/'
        ]
      },
      data: {}
    },
    dependencies: [],
    expires: 0
  },

  delete: {
    request: {
      method: 'DELETE',
      url: '/api/session',
      data: {},
      headers: {
        cookie: 'csrftoken=yJisbQFz9IhO9bRQ9ZLXpIf5mZboQXv3; sessionid=d8f0c4fa6febfa5b95be4a43ad72d7c2'
      }
    },
    response: {
      statusCode: 204,
      headers: {
        'set-cookie': 'sessionid=1487791a56bd72d1b00fe4e3588cac66; expires=Fri, 18-Nov-2016 18:10:58 GMT; \
Max-Age=1209600; Path=/'
      },
      data: {}
    },
    dependencies: [],
    expires: 0
  }
});
