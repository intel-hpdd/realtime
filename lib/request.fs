module Realtime.Request

open Fable.Import.Node
open Fable.Import
open Fable.Core
open Fable.Core.JsInterop
open Fable.PowerPack

let private tryJson x =
  try
    let result = Fable.Import.JS.JSON.parse x
    Ok result
  with
  | ex ->
    Error ex

let private mergeObj updates original =
  JS.Object.assign(createObj [], original, updates)

let cloneOpts (opts:Https.RequestOptions):Https.RequestOptions =
  (mergeObj createEmpty<Https.RequestOptions> opts) :?> Https.RequestOptions

let createFromUrl (method:Http.Methods) (url:Url.Url<_>) =
  let opts = createEmpty<Https.RequestOptions>
  opts.protocol <- url.protocol
  opts.host <- url.host
  opts.port <- Option.map int url.port
  opts.hostname <- url.hostname
  opts.path <- url.path
  opts.method <- Some method
  opts

let createUrl (method:Http.Methods) (url:string) =
  Url.parse url
    |> createFromUrl method

/// Set the request path. Defaults to '/'.
/// Should include query string if any. E.G. '/index.html?page=12'.
/// An exception is thrown when the request path
/// contains illegal characters.
/// Currently, only spaces are rejected but that may change in the future.
let path p (opts:Https.RequestOptions) =
  let opts' = cloneOpts opts

  opts'.path <- Some p
  opts'

let rejectUnauthorized x (opts:Https.RequestOptions) =
  let opts' = cloneOpts opts
  opts'.rejectUnauthorized <- Some x
  opts'

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
  Promise.create <| fun resolve reject ->
    let req = Https.request(opts)
    req.on("response", fun (res:Http.IncomingMessage) ->
      res.pause() |> ignore

      resolve (req, res)
    ) |> ignore

    req.``end``() |> ignore

/// Reads all response data in as string
/// and returns a Promise of the data.
let getBodyAsString (_, resp:Http.IncomingMessage) =
  Promise.create <| fun res _ ->
    let mutable data = ""

    resp
      .on("data", fun (d) ->
        data <- (data + d)
      ).on("end", fun () ->
        printfn "ending with data: %s" data
        res data
      )
      |> ignore

    resp.resume()
      |> ignore

/// Reads all response data to a JSON object.
let getBodyAsJSON (req, resp:Http.IncomingMessage) =
  promise {
    let! data = getBodyAsString (req, resp)

    return tryJson data
  }
