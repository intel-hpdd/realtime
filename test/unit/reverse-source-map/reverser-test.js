'use strict';

var proxyquire = require('proxyquire').noPreserveCache().noCallThru();
var λ = require('highland');
var stream = require('stream');

describe('reverser', function () {
  var through, fs, conf, reverseSrcMap, reverser, srcMapReverseFile, srcMapReverseInstance, s, srcMapPath,
    trace, srcMapStream;

  beforeEach(function () {
    through = {
      bufferString: jasmine.createSpy('bufferString').and.callFake(function (s) {
        return s.invoke('toString', ['utf8']);
      })
    };

    srcMapReverseFile = '{version: "3"}';
    var passThrough = new stream.PassThrough();
    passThrough.write(srcMapReverseFile);
    passThrough.end();
    fs = {
      createReadStream: jasmine.createSpy('createReadStream').and.returnValue(passThrough)
    };

    trace = 'Error: Come on sourcemaps.\n';
    s = λ([trace]);

    srcMapPath = 'path/to/source/map.js';
    conf = {
      get: jasmine.createSpy('get').and.returnValue(srcMapPath)
    };

    srcMapReverseInstance = jasmine.createSpy('reverseSrcMapInstance');
    reverseSrcMap = jasmine.createSpy('reverseSrcMap').and.returnValue(srcMapReverseInstance);

    reverser = proxyquire('../../../reverse-source-map/reverser', {
      fs: fs,
      '../conf': conf,
      '@intel-js/through': through,
      '@intel-js/srcmap-reverse': reverseSrcMap
    });

    srcMapStream = s.through(reverser);
  });

  it('should call createReadStream with the source map path', function (done) {
    srcMapStream.each(function () {
      expect(fs.createReadStream).toHaveBeenCalledOnceWith(srcMapPath);
      done();
    });
  });

  it('should call bufferString twice', function (done) {
    srcMapStream.each(function () {
      expect(through.bufferString).toHaveBeenCalledTwice();
      done();
    });
  });

  it('should invoke reverseSrcMap', function (done) {
    srcMapStream.each(function () {
      expect(reverseSrcMap).toHaveBeenCalledOnceWith(srcMapReverseFile);
      done();
    });
  });

  it('should invoke the instance of reverse source map', function (done) {
    srcMapStream.each(function () {
      expect(srcMapReverseInstance).toHaveBeenCalledOnceWith(trace);
      done();
    });
  });
});
