// Copyright (c) 2017 Intel Corporation. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

module Realtime.MultiplexMiddleware

open System
open System.Text.RegularExpressions
open Fable.Core
open Fable.Import
open Fable.Import.Node
open Realtime.Router

type Options = {
  qs: obj option;
  jsonMask: string option;
  method: string;
}

type SocketData = {
  path: string;
  options: Options;
  messageId: string
};

type Req = {
  verb: string;
  data: obj;
  ``endName``: string
}

type Resp = {
  socket: SocketIo.Socket;
  ack: JS.Function option
}

let routeIncomingData s ack data =
    printfn "got some data %O" data

    let parsedUrl = Url.parse(data.path)
    // let qs =
    //   parsedUrl.query
    //   |> Option.map Querystring.parse

    let req = {
      verb = data.options.method;
      data = data.options;
      endName = "end" + data.messageId;
    }

    let resp = {
      socket = s;
      ack = ack;
    }

    match parsedUrl.pathname with
    | Some(x) -> realtimeRouter.go x req resp
    | None -> ()

let MESSAGE_NAME = "multiplexedMessage"

let matchMessage message =
  match Regex.Match(message, "message(\\d+)") with
  | m when m.Success -> Some(m.Groups.[1].Value)
  | _ -> None

let multiplexMiddleware (socket:SocketIo.Socket) (args:SocketIo.SocketUseArgs<SocketData>) next =
  let (name, socketData', ack) = args

  matchMessage name
  |> (Option.map <| fun id ->
    let data = match socketData' with
      | Some(x) -> x
      | None -> JsInterop.createEmpty<SocketData>

    data
      |> fun x -> { x with messageId = id; }
      |> routeIncomingData socket ack
      |> ignore
  ) |> ignore

  next(None)
