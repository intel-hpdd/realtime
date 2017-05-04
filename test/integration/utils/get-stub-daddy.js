import getStubDaddy from '@mfl/stub-daddy';
import conf from '../../../conf';
import url from 'url';

export default () =>
  getStubDaddy({
    port: url.parse(conf.SERVER_HTTP_URL).port
  });
