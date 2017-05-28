// Copyright (c) 2017 Intel Corporation. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

module Realtime.MultiplexMiddleware

open System
open System.Text.RegularExpressions
open Fable.Core
open Fable.Core.JsInterop
open Fable.Import
open Realtime.Router

let matchMessage message =
  match Regex.Match(message, "message(\\d+)") with
  | m when m.Success -> Some(m.Groups.[1].Value)
  | _ -> None

let createMiddlewareArgs socket (args:SocketIo.SocketUseArgs<SocketData>) =
  let (name, socketData', ack) = args

  let id =
    match matchMessage name with
    | Some x -> x
    | None -> raise (System.Exception "Cannot route without a messageId")

  let data =
    match socketData' with
    | Some(x) -> x
    | None -> createEmpty<SocketData>

  let req = createRequest { data with messageId = id; }
  let resp = createResponse socket ack

  (data.path, req, resp)

let multiplexMiddleware (socket:SocketIo.Socket) (args:SocketIo.SocketUseArgs<SocketData>) next =
  createMiddlewareArgs socket args
    |> fun (path, req, resp) -> realtimeRouter.go path req resp

  next(None)
