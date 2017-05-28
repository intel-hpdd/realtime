module Realtime.Routes

open Realtime.Router
open Realtime.WildcardRoute
open Realtime.HealthRoute

let addRoutes () =
  realtimeRouter
    |> fun x -> x.all "/health" healthRouteHandler
    |> fun x -> x.all "/:endpoint/:rest*" wildcardRouteHandler
    |> ignore
