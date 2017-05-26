module rec Fable.Import.Router

open Fable.Core

type Verbs = {
  GET: string;
  POST: string;
  PUT: string;
}

type [<AllowNullLiteral>] IRouterReq =
  abstract verb: string with get, set
  abstract ``params``: obj with get, set
  abstract matches: string list with get, set

type [<AllowNullLiteral>] RouterStatic =
  abstract verbs: Verbs
  abstract all<'a, 'b> : path:string -> fn:('a -> 'b -> ('a -> 'b -> unit) -> unit) -> RouterStatic
  abstract get: path:string -> fn:('a -> 'b -> ('a -> 'b -> unit)) -> RouterStatic
  abstract go: path:string -> req: 'a -> resp: 'b -> unit
  abstract addStart: fn:('a -> 'b -> (obj[] -> unit)) -> RouterStatic

type [<AllowNullLiteral>] IExports =
  [<Emit("$0()")>] abstract Invoke: unit -> RouterStatic

[<Import("default","@mfl/router")>]
let ``router``:IExports = jsNative
