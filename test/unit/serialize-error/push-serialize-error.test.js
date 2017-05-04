import rewire from 'rewire';
const pushSerializeError = rewire(
  '../../../serialize-error/push-serialize-error'
);

import {
  describe,
  beforeEach,
  afterEach,
  it,
  expect,
  jasmine
} from '../../jasmine.js';

describe('push serialize error', function() {
  let revert, err, push, serializeError, serializedError;
  beforeEach(function() {
    err = new Error('im an error');
    push = jasmine.createSpy('push');
    serializedError = { error: 'im an error' };
    serializeError = jasmine
      .createSpy('serializeError')
      .and.returnValue(serializedError);

    revert = pushSerializeError.__set__({
      serializeError: serializeError
    });

    pushSerializeError(err, push);
  });

  afterEach(function() {
    revert();
  });

  it('should push', function() {
    expect(push).toHaveBeenCalledOnceWith(null, serializedError);
  });

  it('should invoke serializeError with the error', function() {
    expect(serializeError).toHaveBeenCalledOnceWith(err);
  });
});
