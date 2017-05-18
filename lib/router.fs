module Realtime.Router

open Fable.Import.Router
open Realtime.WildcardRoute

let realtimeRouter = router.Invoke<obj, obj>()

realtimeRouter.all "/:endpoint/:rest*" wildcardRouteHandler
  |> ignore

