'use strict';

var rewire = require('rewire');
var commandUtils = rewire('../../../socket-router/command-utils');
var fixtures = require('../../integration/fixtures');
var λ = require('highland');
var obj = require('@intel-js/obj');
var fp = require('@intel-js/fp');

describe('command utils', function () {
  var revoke, apiRequest, responseStream;

  beforeEach(function () {
    responseStream = λ();
    apiRequest = jasmine.createSpy('apiRequest').and.returnValue(responseStream);

    revoke = commandUtils.__set__({
      apiRequest: apiRequest
    });
  });

  afterEach(function () {
    revoke();
  });

  describe('get commands', function () {
    var result, commandData;

    beforeEach(function () {
      commandData = [
        {
          objects: [
            {
              id: 1,
              complete: true
            },
            {
              id: 2,
              complete: true
            }
          ]
        }
      ];

      result = commandUtils.getCommands(['1', '2']);
    });

    it('should call apiRequest', function () {
      result.each(fp.noop);

      expect(apiRequest).toHaveBeenCalledOnceWith('/command', {
        qs: {
          id__in: ['1', '2'],
          limit: 0
        }
      });
    });

    it('should send the original data', function () {
      result
        .each(function (data) {
          expect(data).toEqual(commandData[0].objects);
        });

      responseStream.write({
        body: commandData[0]
      });
      responseStream.end();
    });

    it('should catch an error in the response', function (done) {
      result
        .errors(function onError (err) {
          expect(err).toEqual(error);
          done();
        })
        .each(done.fail);

      var error = new Error('im an error');

      responseStream.write(new StreamError(error));
      responseStream.end();
    });

    it('should not return on unfinished commands', function () {
      var incompleteData = obj.clone(commandData);
      incompleteData[0].objects[0].complete = false;

      responseStream.write({
        body: incompleteData[0]
      });
      responseStream.end();

      result
        .otherwise(λ(['nope']))
        .each(function (x) {
          expect(x).toEqual('nope');
        });
    });
  });

  describe('wait for commands', function () {
    var waiter, getCommands, commandStream, revoke2, timeout;

    beforeEach(function () {
      commandStream = λ();

      getCommands = jasmine
        .createSpy('getCommands')
        .and.returnValue(commandStream);

      revoke = commandUtils.__set__('exports', {
        getCommands: getCommands
      });

      timeout = jasmine.createSpy('setTimeout');

      revoke2 = commandUtils.__set__('global', {
        setTimeout: timeout
      });

      waiter = commandUtils.waitForCommands(['1', '2']);
    });

    afterEach(function () {
      revoke();
      revoke2();
    });

    it('should be a function', function () {
      expect(commandUtils.waitForCommands).toEqual(jasmine.any(Function));
    });

    it('should return a stream', function () {
      expect(λ.isStream(waiter)).toBe(true);
    });

    describe('getting values', function () {
      var spy;

      beforeEach(function () {
        spy = jasmine.createSpy('spy');
        waiter.pull(spy);
      });

      it('should pass the ids to getCommands', function () {
        expect(getCommands).toHaveBeenCalledOnceWith(['1', '2']);
      });

      it('should push the value downstream', function () {
        commandStream.write({ foo: 'bar' });

        expect(spy).toHaveBeenCalledOnceWith(null, { foo: 'bar' });
      });

      it('should push nil downstream', function () {
        commandStream.write({ foo: 'bar' });
        waiter.pull(spy);

        expect(spy).toHaveBeenCalledOnceWith(null, λ.nil);
      });

      it('should push an error downstream', function () {
        var err = new Error('boom!');

        commandStream.write(new StreamError(err));

        expect(spy).toHaveBeenCalledOnceWith(err, undefined);
      });

      it('should call next on Error', function () {
        var err = new Error('boom!');
        commandStream.write(new StreamError(err));

        expect(timeout).toHaveBeenCalledOnceWith(jasmine.any(Function), 1000);
      });

      it('should call timeout on nil', function () {
        commandStream.end();

        expect(timeout).toHaveBeenCalledOnceWith(jasmine.any(Function), 1000);
      });
    });
  });

  describe('get steps', function () {
    var commands, jobs, commandStream, resultStream, spy;

    beforeEach(function () {
      spy = jasmine.createSpy('spy');
      commands = fixtures.command()
        .twoServers.response.data.objects;

      jobs = fixtures.job()
        .twoServers.response.data;

      commandStream = λ();
      resultStream = commandUtils.getSteps(commandStream);
    });

    it('should call apiRequest with job ids', function () {
      commandStream.write(commands);
      commandStream.end();

      resultStream.each(fp.noop);

      expect(apiRequest).toHaveBeenCalledOnceWith('/job', {
        qs: {
          id__in: ['2', '3'],
          limit: 0
        },
        jsonMask: 'objects(step_results,steps)'
      });
    });

    it('should return the steps', function (done) {
      commandStream.write(commands);
      commandStream.end();
      responseStream.write({
        body: jobs
      });
      responseStream.end();

      resultStream
        .errors(done.fail)
        .each(function (x) {
          var result = fp.flow(
            fp.lensProp('objects'),
            fp.map(fp.lensProp('step_results')),
            fp.map(obj.values),
            fp.unwrap
          )(jobs);

          expect(x).toEqual(result);
          done();
        });
    });

    it('should return empty on no data', function () {
      commandStream.end();

      resultStream
        .otherwise(λ(['nope']))
        .each(spy);

      expect(spy).toHaveBeenCalledOnceWith('nope');
    });

    it('should throw on error', function (done) {
      var boom = new Error('boom!');
      commandStream.write(new StreamError(boom));

      resultStream
        .errors(function (err) {
          expect(err).toEqual(err);
          done();
        })
        .each(done.fail);
    });
  });
});

function StreamError (err) {
  this.__HighlandStreamError__ = true;
  this.error = err;
}
