// Copyright (c) 2017 Intel Corporation. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

module Realtime.Main

open Fable.Import
open Fable.Import.Node.Base
open Fable.Import.Node.Globals
open Fable.Import.Node
open Fable.Core
open Fable.Core.JsInterop
open Fable.Import.SocketIo
open Realtime.Router

open Realtime.MultiplexMiddleware

type Config = {
  npm_package_config_port: string
}

type Options = {
  method: string;
}

type Data = {
  method: string;
  path: string;
  query: string option;
  messageId: string;
  options: Options;
}

type Req = {
  verb: string;
  data: obj;
  ``endName``: string
}

type Resp = {
  socket: SocketIo.Socket;
  ack: JS.Function option
}

let private env = ``process``.env :?> Config
let private port = env.npm_package_config_port

printfn "Listening on %s" port
let private io = ``socket.io``.Invoke(port)

io.on_connection (fun (s:Socket) ->

  s.``use`` (multiplexMiddleware s) |> ignore


  s.on(MESSAGE_NAME, fun (data:Data) ack ->
    let parsedUrl = url.parse(data.path)
    let qs =
      parsedUrl.query
      |> Option.map querystring.parse

    let req = {
      verb = data.method;
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

  ) |> ignore;

  s.on("error",
    fun (e:NodeJS.ErrnoException) -> printfn "%s" e.message
  ) |> ignore
) |> ignore

