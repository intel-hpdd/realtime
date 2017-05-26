namespace Realtime.Test

module Request =
  open Fable.Import.Jest
  open Fable.Import.Jest.Matchers

  open Fable.Core.JsInterop
  open Fable.Import.Node
  open Realtime.Request
  open Fable.Import.Node.Http
  open Fable.Import.Node.Https
  open Fable.PowerPack

  jest.mock "https"

  test "create url fills out options" <| fun () ->
    let out = createUrl Methods.Get "https://google.com/foo/bar"

    let expected = createEmpty<Https.RequestOptions>
    expected.protocol <- Some "https:"
    expected.host <- Some "google.com"
    expected.hostname <- Some "google.com"
    expected.port <- None
    expected.method <- Some Methods.Get
    expected.path <- Some "/foo/bar"

    (toEqual out expected)

  test "update header" <| fun () ->
    let out = (setHeader "foo" "bar" createEmpty<Https.RequestOptions>)

    let expected = createEmpty<Https.RequestOptions>
    expected.headers <- Some(createObj ["foo" ==> "bar"])

    (toEqual out expected)

  test "update headers" <| fun () ->
    let headers = createObj ["foo" ==> "bar"; "bar" ==> "baz"]

    let out = (setHeaders headers createEmpty<Https.RequestOptions>)

    let expected = createEmpty<Https.RequestOptions>
    expected.headers <- Some(createObj ["foo" ==> "bar"; "bar" ==> "baz"])

    toEqual out expected

  testAsync "run request" <| fun () ->
    expect.assertions 2

    let opts = createEmpty<Https.RequestOptions>

    let y = Https?ee

    let p = run opts

    !!(y?on)
      |> getMock
      |> fun x -> x.calls
      |> List.last
      |> List.last
      |> fun x -> x("resp")
      |> ignore

    p
      |> Promise.map (fun (x, y) ->
        toEqual x Https?ee
        toEqual y "resp"
      )
