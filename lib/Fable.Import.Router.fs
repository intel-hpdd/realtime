[<AutoOpen>]
module rec Fable.Import.Router

open Fable.Core

type Verbs = {
  GET: string;
  POST: string;
  PUT: string;
}

type [<AllowNullLiteral>] RouterStatic<'a, 'b> =
  abstract verbs: Verbs
  abstract all: path:string -> fn:('a -> 'b -> (obj[] -> unit)) -> RouterStatic<'a, 'b>
  abstract get: path:string -> fn:('a -> 'b -> (obj[] -> unit)) -> RouterStatic<'a, 'b>
  abstract go: path:string -> req: 'a -> resp: 'b -> unit
  abstract addStart: fn:('a -> 'b -> (obj[] -> unit)) -> RouterStatic<'a, 'b>

type [<AllowNullLiteral>] Globals =
  [<Emit("$0()")>] abstract Invoke<'a, 'b> : unit -> RouterStatic<'a, 'b>

[<Import("default","@mfl/router")>]
let ``router``:Globals = jsNative
