var proxyquire = require('proxyquire').noPreserveCache().noCallThru();
var λ = require('highland');
var stream = require('stream');

describe('reverser', function () {
  var through, fs, conf, reverser, srcmapReverseFile, srcmapReverse, s, srcMapPath,
    trace, srcMapStream;

  beforeEach(function () {
    through = {
      bufferString: jasmine.createSpy('bufferString').and.callFake(function (s) {
        return s.invoke('toString', ['utf8']);
      })
    };

    srcmapReverseFile = '{version: "3"}';
    var passThrough = new stream.PassThrough();
    passThrough.write(srcmapReverseFile);
    passThrough.end();
    fs = {
      createReadStream: jasmine.createSpy('createReadStream').and.returnValue(passThrough)
    };

    trace = 'Error: Come on sourcemaps.\n';
    s = λ([trace]);

    srcMapPath = 'path/to/source/map.js';
    conf = {
      SOURCE_MAP_PATH: srcMapPath
    };

    srcmapReverse = jasmine.createSpy('srcmapReverse');

    reverser = proxyquire('../../../reverse-source-map/reverser', {
      fs: fs,
      '../conf': conf,
      'intel-through': through,
      'intel-srcmap-reverse': {
        default: srcmapReverse
      }
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
      expect(srcmapReverse).toHaveBeenCalledOnceWith(srcmapReverseFile, trace);
      done();
    });
  });
});
