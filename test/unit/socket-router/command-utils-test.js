'use strict';

var rewire = require('rewire');
var commandUtils = rewire('../../../socket-router/command-utils');
var fixtures = require('../../integration/fixtures');
var λ = require('highland');
var obj = require('intel-obj');
var fp = require('intel-fp/dist/fp');

describe('command utils', function () {
  var revoke, apiRequest, responseStream,
    pollingRequest, pollStream;

  beforeEach(function () {
    responseStream = λ();
    apiRequest = jasmine.createSpy('apiRequest')
      .and.returnValue(responseStream);

    pollStream = λ();
    spyOn(pollStream, 'destroy')
      .and.callThrough();
    pollingRequest = jasmine.createSpy('pollingRequest')
      .and.returnValue(pollStream);

    revoke = commandUtils.__set__({
      apiRequest: apiRequest,
      pollingRequest: pollingRequest
    });
  });

  afterEach(function () {
    revoke();
  });

  describe('wait for commands', function () {
    var waiter, commandData;

    beforeEach(function () {
      commandData = {
        body: {
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
      };

      waiter = commandUtils.waitForCommands({
        Cookie: 'sessionid=123'
      }, ['1', '2']);
    });

    it('should be a function', function () {
      expect(commandUtils.waitForCommands)
        .toEqual(jasmine.any(Function));
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

      it('should pass the headers and ids to pollingRequest', function () {
        expect(pollingRequest)
          .toHaveBeenCalledOnceWith('/command', {
            headers: {
              Cookie: 'sessionid=123'
            },
            qs: {
              id__in: [ '1', '2' ],
              limit: 0
            }
          });
      });

      it('should push the value downstream', function () {
        pollStream.write(commandData);

        expect(spy)
          .toHaveBeenCalledOnceWith(null, commandData.body.objects);
      });

      it('should push nil downstream', function (done) {
        pollStream.write(commandData);
        waiter
          .errors(done.fail)
          .pull(spy);

        process.nextTick(function () {
          expect(spy).toHaveBeenCalledOnceWith(null, λ.nil);
          done();
        });
      });

      it('should destroy on data', function (done) {
        pollStream.write(commandData);

        process.nextTick(function () {
          expect(pollStream.destroy).toHaveBeenCalledOnce();
          done();
        });
      });

      it('should push an error downstream', function () {
        var err = new Error('boom!');
        pollStream.write(new StreamError(err));

        expect(spy).toHaveBeenCalledOnceWith(err, undefined);
      });

      it('should not return on unfinished commands', function () {
        var incompleteData = obj.clone(commandData);
        incompleteData.body.objects[0].complete = false;

        pollStream.write(incompleteData);

        expect(spy).not.toHaveBeenCalled();
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
      resultStream = commandUtils.getSteps({
        Cookie: 'sessionid=123'
      }, commandStream);
    });

    it('should call apiRequest with job ids', function () {
      commandStream.write(commands);
      commandStream.end();

      resultStream.each(fp.noop);

      expect(apiRequest).toHaveBeenCalledOnceWith('/job', {
        headers: {
          Cookie: 'sessionid=123'
        },
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
