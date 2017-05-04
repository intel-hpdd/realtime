import * as fp from '@mfl/fp';
import rewire from 'rewire';
let serializeError = rewire('../../../serialize-error');

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
    let result = serializeError(error);

    expect(result.error.statusCode).toEqual(500);
  });
});
