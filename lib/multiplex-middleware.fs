// Copyright (c) 2017 Intel Corporation. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

module Realtime.MultiplexMiddleware

open System
open Fable.Import.JS
open Fable.Import
open Fable.Core.JsInterop
open Fable.Import
open System.Text.RegularExpressions
open Fable.Core

type Options = {
  method: string;
}

type SocketData = {
  method: string;
  path: string;
  query: string option;
  options: Options;
  messageId: string
};

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
    | None -> createEmpty<SocketData>

    data
      |> fun x -> { x with messageId = id; }
      |> fun x -> socket.emit(MESSAGE_NAME, x, ack)
      |> ignore
  ) |> ignore

  next(None)
