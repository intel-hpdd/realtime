module Realtime.Router

open Fable.Import
open Fable.Import.Node
open Fable.Import.Router

type IRealtimeRouterInputReq =
  abstract verb: string with get, set
  abstract data: Https.RequestOptions with get, set
  abstract messageId: string with get, set

type IRealtimeRouterOutputReq =
  inherit IRealtimeRouterInputReq
  abstract matches: string array with get, set

type IRealtimeRouterResp =
  abstract socket: SocketIo.Socket with get, set
  abstract ack: JS.Function option with get, set

let realtimeRouter = router.Invoke()

// realtimeRouter.all "/:endpoint/:rest*" wildcardRouteHandler
//   |> ignore
