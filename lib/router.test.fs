namespace Realtime.Test

module Router =
  open Fable.Import.Jest
  open Fable.Core.JsInterop
  open Fable.Import.Jest.Matchers

  jest.mock("@mfl/router", fun () -> fun () -> "ROUTER")

  open Realtime.Router

  test "it should create a new router" <| fun () ->
    toBe realtimeRouter "ROUTER"
