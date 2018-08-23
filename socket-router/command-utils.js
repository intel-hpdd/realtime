//
// Copyright (c) 2018 DDN. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

"use strict";

const apiRequest = require("../api-request");
const pollingRequest = require("../polling-request");
const fp = require("intel-fp/dist/fp");
const obj = require("intel-obj");

const objectsLens = fp.pathLens(["body", "objects"]);

exports.waitForCommands = fp.curry(2, function waitForCommands(headers, ids) {
  const pickValues = fp.flow(
    obj.pick.bind(null, ["cancelled", "complete", "errored"]),
    obj.values
  );

  const commandsFinished = fp.flow(
    fp.map(pickValues),
    fp.map(fp.some(fp.identity)),
    fp.every(fp.identity)
  );

  const s = pollingRequest("/command", {
    headers: headers,
    qs: {
      id__in: ids,
      limit: 0
    }
  });

  return s
    .map(objectsLens)
    .filter(commandsFinished)
    .tap(function destroyOnCompletion() {
      process.nextTick(s.destroy.bind(s));
    });
});

const jobRegexp = /^\/api\/job\/(\d+)\/$/;

const getJobIds = fp.flow(
  fp.map(fp.lensProp("jobs")),
  fp.unwrap,
  fp.map(fp.invokeMethod("match", [jobRegexp])),
  fp.map(fp.lensProp("1"))
);

exports.getSteps = fp.curry(2, function getSteps(headers, s) {
  return s
    .map(getJobIds)
    .flatMap(function getJobs(ids) {
      return apiRequest("/job", {
        headers: headers,
        qs: {
          id__in: ids,
          limit: 0
        },
        jsonMask: "objects(step_results,steps)"
      });
    })
    .map(objectsLens)
    .map(
      fp.map(function getSteps(job) {
        return job.step_results[job.steps[0]];
      })
    );
});
