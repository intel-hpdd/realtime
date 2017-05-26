module Realtime.Request

open Fable.Import.Node
open Fable.Import.JS
open Fable.Core
open Fable.Core.JsInterop

let private mergeObj updates original =
  Object.assign(createObj [], original, updates)

let createUrl (method:Http.Methods) (url:string) =
  let parsedUrl = Url.parse url

  let opts = createEmpty<Https.RequestOptions>
  opts.protocol <- parsedUrl.protocol
  opts.host <- parsedUrl.host
  opts.port <- Option.map int parsedUrl.port
  opts.hostname <- parsedUrl.hostname
  opts.path <- parsedUrl.path
  opts.method <- Some method

  opts

let setHeaders headers (opts:Https.RequestOptions) =

    let headers' =
      match opts.headers with
      | Some (x) -> mergeObj headers x
      | None -> headers

    mergeObj opts (createObj ["headers" ==> headers']) :?> Https.RequestOptions

let setHeader (key:string) (value:string) (opts:Https.RequestOptions):Https.RequestOptions =
  let newHeaders = createObj [ key ==> value ]

  setHeaders newHeaders opts

let run (opts:Https.RequestOptions) =
  Fable.PowerPack.Promise.create <| fun resolve reject ->

    let req = Https.request(opts)
    req.on("response", fun res ->
      resolve (req, res)
    ) |> ignore
