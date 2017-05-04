import client from 'socket.io-client';
import conf from '../../../conf';
import { format } from 'util';

export default function invokeSocket(extraHeaders) {
  return client(format('http://localhost:%s', conf.REALTIME_PORT), {
    forceNew: true,
    extraHeaders
  });
}
