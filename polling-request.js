//
// INTEL CONFIDENTIAL
//
// Copyright 2013-2016 Intel Corporation All Rights Reserved.
//
// The source code contained or described herein and all documents related
// to the source code ("Material") are owned by Intel Corporation or its
// suppliers or licensors. Title to the Material remains with Intel Corporation
// or its suppliers and licensors. The Material contains trade secrets and
// proprietary and confidential information of Intel or its suppliers and
// licensors. The Material is protected by worldwide copyright and trade secret
// laws and treaty provisions. No part of the Material may be used, copied,
// reproduced, modified, published, uploaded, posted, transmitted, distributed,
// or disclosed in any way without Intel's prior express written permission.
//
// No license under any patent, copyright, trade secret or other intellectual
// property right is granted to or conferred upon you by disclosure or delivery
// of the Materials, either expressly, by implication, inducement, estoppel or
// otherwise. Any license under such intellectual property rights must be
// express and approved by Intel in writing.

import λ from 'highland';

import * as obj from '@mfl/obj';
import apiRequest from './api-request';

module.exports = function pollingRequest(path, options) {
  var ifNoneMatch = 0;

  return λ(function generator(push, next) {
    var withHeader = obj.merge(
      {},
      {
        headers: {
          'If-None-Match': ifNoneMatch
        }
      },
      options
    );

    var r = apiRequest(path, withHeader);

    var stream = this;
    stream._destructors.push(r.abort);

    r
      .filter(function remove304s(x) {
        if (x.statusCode !== 304) {
          ifNoneMatch = x.headers.etag;
          return true;
        }

        next();
      })
      .errors(function pushErr(err) {
        push(err);
        next();
      })
      .each(function pushData(x) {
        push(null, x);
        next();
      })
      .done(function removeAbort() {
        var idx = stream._destructors.indexOf(r.abort);

        if (idx !== -1) stream._destructors.splice(idx, 1);
      });
  });
};
