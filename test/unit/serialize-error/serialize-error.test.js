import * as fp from '@mfl/fp';
import rewire from 'rewire';
const serializeError = rewire('../../../serialize-error');

import {
  describe,
  beforeEach,
  afterEach,
  it,
  expect,
  jasmine
} from '../../jasmine.js';

describe('error handler', function() {
  let error, errorSerializer, revert;

  beforeEach(function() {
    errorSerializer = jasmine
      .createSpy('errorSerializer')
      .and.callFake(fp.identity);
    revert = serializeError.__set__('errorSerializer', errorSerializer);

    error = new Error('foo');
  });

  afterEach(function() {
    revert();
  });

  it('should return a normalized response', function() {
    error.statusCode = 404;

    expect(serializeError(error)).toEqual({
      error: error
    });
  });

  it("should add a status code if it's missing", function() {
    const result = serializeError(error);

    expect(result.error.statusCode).toEqual(500);
  });
});
