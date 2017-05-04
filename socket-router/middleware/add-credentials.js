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

import * as obj from '@mfl/obj';

const regexp = /csrftoken=([^;|$]+)/;

export default function addCredentials(req, resp, next) {
  const headers = {};
  const requestHeaders = resp.socket.request.headers;

  if (requestHeaders.cookie) {
    headers.Cookie = requestHeaders.cookie;

    const csrfTokenMatch = requestHeaders.cookie.match(regexp);
    if (csrfTokenMatch && csrfTokenMatch[1])
      headers['X-CSRFToken'] = csrfTokenMatch[1];
  }

  headers['User-Agent'] = requestHeaders['user-agent'];

  req.data = obj.merge(
    {},
    {
      headers: headers
    },
    req.data
  );

  next(req, resp);
}
