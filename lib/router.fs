// Copyright (c) 2017 Intel Corporation. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

module Realtime.Router

open Fable.Import
open Fable.Import.Node
open Fable.Import.Node.Http
open Fable.Import.Router
open Fable.Core.JsInterop

type IRealtimeRouterInputReq =
  abstract verb: Http.Methods with get, set
  abstract data: Https.RequestOptions with get, set
  abstract messageId: string with get, set

type IRealtimeRouterOutputReq =
  inherit IRealtimeRouterInputReq
  abstract matches: string array with get, set

type IRealtimeRouterResp =
  abstract socket: SocketIo.Socket with get, set
  abstract ack: ('a -> unit) option with get, set

type SocketData = {
  path: string;
  options: Https.RequestOptions;
  messageId: string;
}

let createRequest data =
  let method =
    match data.options.method with
    | Some x -> x
    | None -> Methods.Get

  let req = createEmpty<IRealtimeRouterInputReq>
  req.verb <- method
  req.data <- data.options
  req.messageId <- data.messageId

let createResponse socket ack =
    let resp = createEmpty<IRealtimeRouterResp>
    resp.socket <- socket
    resp.ack <- ack

let realtimeRouter = router.Invoke()

// realtimeRouter.all "/:endpoint/:rest*" wildcardRouteHandler
//   |> ignore
