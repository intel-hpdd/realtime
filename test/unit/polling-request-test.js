const proxyquire = require('proxyquire').noPreserveCache().noCallThru();
import λ from 'highland';
import * as fp from '@mfl/fp';

describe('polling request', function() {
  let pollingRequest, apiRequest, s;

  beforeEach(function() {
    apiRequest = jasmine.createSpy('apiRequest').and.callFake(function() {
      s = λ();
      s.abort = jasmine.createSpy('abort');
      return s;
    });

    pollingRequest = proxyquire('../../polling-request', {
      './api-request': apiRequest
    });
  });

  it('should be a function', function() {
    expect(pollingRequest).toEqual(jasmine.any(Function));
  });

  describe('invoking', function() {
    let r;

    beforeEach(function() {
      r = pollingRequest('/foo', {
        bar: 'baz'
      });
    });

    it('should return a stream', function() {
      expect(λ.isStream(r)).toBe(true);
    });

    it('should make a request with the params', function() {
      r.each(fp.noop);

      expect(apiRequest).toHaveBeenCalledOnceWith('/foo', {
        bar: 'baz',
        headers: {
          'If-None-Match': 0
        }
      });
    });

    it('should emit data', function(done) {
      r.stopOnError(done.fail).each(function(x) {
        expect(x).toEqual({
          statusCode: 200,
          headers: {
            etag: '232983902184901841'
          }
        });
        done();
      });

      s.write({
        statusCode: 200,
        headers: {
          etag: '232983902184901841'
        }
      });
      s.end();
    });

    it('should emit errors', function(done) {
      r
        .stopOnError(function(err) {
          expect(err.message).toEqual('boom!');
          done();
        })
        .each(done.fail);

      s.write({
        __HighlandStreamError__: true,
        error: new Error('boom!')
      });
      s.end();
    });

    it('should abort if stream is destroyed', function() {
      r.each(fp.noop);

      r.destroy();

      expect(s.abort).toHaveBeenCalledOnce();
    });

    it('should not abort if request has finished', function() {
      r.each(fp.noop);
      s.end();
      r.destroy();

      expect(s.abort).not.toHaveBeenCalled();
    });

    it('should filter out 304s', function() {
      const spy = jasmine.createSpy('spy');

      r.each(spy);

      s.write({
        statusCode: 304,
        headers: {
          etag: '232983902184901841'
        }
      });
      s.end();

      expect(spy).not.toHaveBeenCalled();
    });

    it('should update if-none-match with last etag', function() {
      r.each(fp.noop);

      s.write({
        statusCode: 200,
        headers: {
          etag: '232983902184901841'
        }
      });
      s.end();

      expect(apiRequest).toHaveBeenCalledOnceWith('/foo', {
        bar: 'baz',
        headers: {
          'If-None-Match': '232983902184901841'
        }
      });
    });
  });
});
