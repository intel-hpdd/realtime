import getStubDaddy from '@mfl/stub-daddy';
import conf from '../../../conf';
import url from 'url';

export default function invokeStubDaddy() {
  const stubDaddy = getStubDaddy({
    port: url.parse(conf.SERVER_HTTP_URL).port
  });

  return stubDaddy;
}
