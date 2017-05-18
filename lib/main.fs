// Copyright (c) 2017 Intel Corporation. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

module Realtime.Main

open Fable.Import
open Fable.Import.Node.Globals
open Fable.Import.Node
open Fable.Import.Node.Base
open Fable.Import.SocketIo
open Fable.Core

open Realtime.MultiplexMiddleware

type Config = {
  npm_package_config_port: string
}

let private env = ``process``.env :?> Config
let private port = env.npm_package_config_port

printfn "Listening on %s" port
let private io = ``socket.io``.Invoke(port)

io.on_connection (fun (s:Socket) ->
  s.``use`` (multiplexMiddleware s) |> ignore

  s.on("error",
    fun (e:NodeJS.ErrnoException) -> printfn "%s" e.message
  ) |> ignore
) |> ignore

