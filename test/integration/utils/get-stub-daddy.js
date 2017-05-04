import getStubDaddy from '@mfl/stub-daddy';
import conf from '../../../conf';
import url from 'url';

module.exports = function invokeStubDaddy() {
  let stubDaddy = getStubDaddy({ port: url.parse(conf.SERVER_HTTP_URL).port });

  return stubDaddy;
};
