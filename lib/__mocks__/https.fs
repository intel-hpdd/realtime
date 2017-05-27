module Realtime.Mocks.Https

open Fable.Import.Jest
open Fable.Core.JsInterop
open Fable.Import.Node

let ee = Events.EventEmitter.Create()
ee?on <- jest.fn()

let request:obj -> Events.EventEmitter = jest.fn(fun () -> ee )
