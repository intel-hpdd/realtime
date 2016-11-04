'use strict';
var client = require('socket.io-client');
var conf = require('../../../conf');
var format = require('util').format;

module.exports = function invokeSocket () {
  return client(format('http://localhost:%s', conf.REALTIME_PORT), {
    forceNew: true,
    extraHeaders: {
      cookie: 'io=-IN8P0JaX0yivaedAAAB; csrftoken=V7ZKtwh29dlG4t1jkqJjIrMj6wH4kF1A; sessionid=99ba2e792a\
915d0648a714b526d00736'
    }
  });
};
