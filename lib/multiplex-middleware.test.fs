namespace Realtime.Test

module MultiplexMiddleware =
  open Fable.Import.Jest
  open Fable.Import.Jest.Matchers
  open Fable.Import.SocketIo
  open Fable.Import
  open Fable.Import.Node
  open Fable.Import.Node.Http
  open Fable.Core.JsInterop
  open Fable.Core

  jest.mock("./router.fs", fun () ->
    createObj [ "realtimeRouter" ==> createObj ["go" ==> jest.fn()]]
  )

  open Realtime.MultiplexMiddleware
  open Realtime.Router // <-- This is a mock

  describe "route incoming data" <| fun () ->
    test "it should call go with path req resp" <| fun () ->
      let socketData = {
        path = "the path";
        options = createEmpty<Https.RequestOptions>;
        messageId = "the message ID"
      }

      routeIncomingData createEmpty<SocketIo.Socket> None socketData

      let req = createEmpty<IRealtimeRouterInputReq>
      req.verb <- Methods.Get
      req.data <- socketData.options
      req.messageId <- "the message ID"

      let resp = createEmpty<IRealtimeRouterResp>
      resp.ack <- None
      resp.socket <- createEmpty<SocketIo.Socket>

      toBeCalledWith3 (realtimeRouter?go) "the path" req resp

  test "if message matches" <| fun () ->
    expect.assertions 2

    toEqualNone (matchMessage "foo")
    toEqualSome (matchMessage "message123") "123"


