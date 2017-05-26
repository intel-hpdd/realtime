module Realtime.Routes

open Realtime.Router
open Realtime.WildcardRoute
open Realtime.HealthRoute

let addRoutes () =
  realtimeRouter.all "/:endpoint/:rest*" wildcardRouteHandler
    |> fun x -> x.all "/health" healthRouteHandler
    |> ignore
