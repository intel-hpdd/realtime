// Copyright (c) 2017 Intel Corporation. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

module Realtime.MultiplexMiddleware

open System
open System.Text.RegularExpressions
open Fable.Core
open Fable.Import
open Fable.Import.Node
open Fable.Import.Node.Http
open Fable.Import.Maybe
open Realtime.Router

type SocketData = {
  path: string;
  options: Https.RequestOptions;
  messageId: string;
}

let routeIncomingData s ack data =
    printfn "Got incoming data %O" data
    // let parsedUrl = Url.parse(data.path)
    // let qs =
    //   parsedUrl.query
    //   |> Option.map Querystring.parse

    let method =
      match data.options.method with
        | Some x -> x
        | None -> Methods.Get

    let req = JsInterop.createEmpty<IRealtimeRouterInputReq>
    req.verb <- method
    req.data <- data.options
    req.messageId <- data.messageId

    let resp = JsInterop.createEmpty<IRealtimeRouterResp>
    resp.socket <- s
    resp.ack <- ack

    realtimeRouter.go data.path req resp

let messageName = "multiplexedMessage"

let matchMessage message =
  match Regex.Match(message, "message(\\d+)") with
  | m when m.Success -> Some(m.Groups.[1].Value)
  | _ -> None

let multiplexMiddleware (socket:SocketIo.Socket) (args:SocketIo.SocketUseArgs<SocketData>) next =
  let (name, socketData', ack) = args

  maybe {
    let! id = matchMessage name

    let data =
      match socketData' with
        | Some(x) -> x
        | None -> JsInterop.createEmpty<SocketData>

    routeIncomingData socket ack { data with messageId = id; }
  }
  |> ignore

  next(None)
