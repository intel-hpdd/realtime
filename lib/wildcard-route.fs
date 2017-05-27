module Realtime.WildcardRoute

let wildcardRouteHandler req resp next =
  printfn "got some data %O" req
  ()
