#r "paket: nuget Fake.Javascript.Npm //"
#r "paket: nuget Fake.Core.Target //"
#r "paket: nuget Thoth.Json.Net //"
#load "./.fake/build.fsx/intellisense.fsx"

open System.Text
open Fake.Core
open Fake.IO
open FileSystemOperators
open Globbing.Operators
open Thoth.Json.Net.Decode

let findSrcRpm path =
  !!(path @@ "*.src.rpm")
      |> Seq.tryHead
      |> function
        | Some x -> x
        | None -> failwith "Could not find SRPM"

let pwd = Shell.pwd()
let specName = "iml-realtime.spec"
let topDir = pwd @@ "_topdir"
let sources = topDir @@ "SOURCES"
let specs = topDir @@ "SPECS"
let spec = specs @@ specName
let srpms = topDir @@ "SRPMS"
let buildDir = pwd @@ "targetdir"
let coprKey = pwd @@ "copr-key"

let cli = """
Build
Usage:
  prog [options]

Options:
  --prod                            Production build
  --copr-project=NAME               Copr Project
  -t, --target <target>             Run the given target (ignored if positional argument 'target' is given)
  --release=NUM                     The release field for this build (defaults to 1)
  --help                            Help
"""

let ctx = Context.forceFakeContext()
let args = ctx.Arguments
let parser = Docopt(cli)
let parsedArguments = parser.Parse(args |> List.toArray)

let release =
  DocoptResult.tryGetArgument "--release" parsedArguments
  |> Option.defaultValue "1"

let isProd =
  DocoptResult.hasFlag "--prod" parsedArguments

let coprRepo =
  DocoptResult.tryGetArgument "--copr-project" parsedArguments
  |> Option.defaultValue "managerforlustre/manager-for-lustre-devel/"

let getPackageValue key decoder =
  Fake.IO.File.readAsString "package.json"
    |> decodeString (field key decoder)
    |> function
      | Ok x -> x
      | Error e ->
        failwithf "Could not find package.json %s, got this error %s" key e

Target.create "Clean" (fun _ ->
  Shell.cleanDirs [buildDir; topDir]
)

Target.create "Topdir" (fun _ ->
  Shell.mkdir topDir
  Shell.mkdir sources
  Shell.mkdir specs
)

Target.create "NpmBuild" (fun _ ->
  if isProd then
    let name = getPackageValue "name" string
    Fake.JavaScript.Npm.exec ("pack " + name) (fun o -> {
      o with WorkingDirectory = sources
    })
  else
    Fake.JavaScript.Npm.install(id)
    Fake.JavaScript.Npm.exec ("pack " + pwd) (fun o -> {
      o with WorkingDirectory = sources
    })
)

Target.create "BuildSpec" (fun _ ->
  let v = getPackageValue "version" string

  Fake.IO.Templates.load [specName + ".template"]
    |> Fake.IO.Templates.replaceKeywords [("@version@", v)]
    |> Fake.IO.Templates.replaceKeywords [("@release@", release)]
    |> Seq.iter(fun (_, file) ->
      let x = UTF8Encoding()

      Fake.IO.File.writeWithEncoding x false spec (Seq.toList file)
    )
)

Target.create "SRPM" (fun _ ->
  let args = (sprintf "-bs --define \"_topdir %s\" %s" topDir spec)
  Shell.Exec ("rpmbuild", args)
    |> function
      | 0 -> ()
      | x -> failwithf "Got a non-zero exit code (%i) for rpmbuild %s" x args
)

Target.create "RPM" (fun _ ->
  let srpm = findSrcRpm(srpms)
  let args = (sprintf "--rebuild --define \"_topdir %s\" %s" topDir srpm)
  Shell.Exec ("rpmbuild", args)
    |> function
      | 0 -> ()
      | x -> failwithf "Got a non-zero exit code (%i) for rpmbuild %s" x args
)

Target.create "Copr" (fun _ ->
  if not (File.exists coprKey) then
    failwithf "Expected copr key at: %s, it was not found" coprKey

  let path = findSrcRpm(srpms)

  let args = sprintf "--config %s build %s %s" coprKey coprRepo path

  Shell.Exec ("copr-cli", args)
    |> function
      | 0 -> ()
      | x -> failwithf "Got a non-zero exit code (%i) for copr-cli %s" x args
)

open Fake.Core.TargetOperators

"Clean"
  ==> "Topdir"
  ==> "NpmBuild"
  ==> "BuildSpec"
  ==> "SRPM"
  ==> "Copr"

"Clean"
  ==> "Topdir"
  ==> "NpmBuild"
  ==> "BuildSpec"
  ==> "SRPM"
  ==> "RPM"

// start build
Target.runOrDefaultWithArguments "Copr"
