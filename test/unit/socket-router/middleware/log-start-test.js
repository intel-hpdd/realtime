import rewire from 'rewire';
const logStart = rewire('../../../../socket-router/middleware/log-start');

import {
  describe,
  beforeEach,
  afterEach,
  it,
  expect,
  jasmine
} from '../../../jasmine.js';

describe('log start', function() {
  let logger, revert, next, req, resp;

  beforeEach(function() {
    logger = {
      info: jasmine.createSpy('info')
    };

    revert = logStart.__set__('logger', logger);

    req = { matches: ['foo'] };

    resp = {};

    next = jasmine.createSpy('next');

    logStart(req, resp, next);
  });

  afterEach(function() {
    revert();
  });

  it('should call next with the request and response', function() {
    expect(next).toHaveBeenCalledOnceWith(req, resp);
  });
});
