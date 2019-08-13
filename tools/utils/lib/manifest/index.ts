import path from 'path'
import * as places from '@tools/places'
import writeJSON from '../write-json'

interface Repository {
  readonly type: 'git'
  readonly url: string
}

interface Bugs {
  readonly url: string
}

type DependencyDict = {
  readonly [name in string]: string
}

type DefaultProdDeps = DependencyDict & {
  readonly tslib: string
  readonly ['@types/node']: string
}

type ScriptDict = {
  readonly [name in string]: string
}

export interface Manifest {
  readonly name?: string
  readonly version?: string
  readonly private?: boolean
  readonly description?: string
  readonly homepage?: string
  readonly license?: string
  readonly author?: string
  readonly maintainers?: readonly string[]
  readonly repository?: Repository
  readonly bugs?: Bugs
  readonly main?: string
  readonly types?: string
  readonly dependencies?: DependencyDict
  readonly devDependencies?: DependencyDict
  readonly peerDependencies?: DependencyDict
  readonly optionalDependencies?: readonly string[]
  readonly scripts?: ScriptDict
}

export interface RootManifest extends Manifest {
  readonly name?: undefined
  readonly version?: undefined
  readonly private: true
  readonly description?: undefined
  readonly homepage: string
  readonly license: string
  readonly author: string
  readonly repository: Repository
  readonly bugs: Bugs
  readonly main?: undefined
  readonly types?: undefined
  readonly dependencies?: undefined
  readonly devDependencies: DependencyDict
  readonly peerDependencies?: undefined
  readonly optionalDependencies?: undefined
  readonly scripts: ScriptDict
}

export interface PackageManifest extends Manifest {
  readonly name: string
  readonly version: string
  readonly private?: false
  readonly homepage: string
  readonly license: string
  readonly author: string
  readonly repository: Repository
  readonly bugs: Bugs
  readonly dependencies: DefaultProdDeps
  readonly devDependencies?: undefined
  readonly scripts?: undefined
}

export interface TestManifest extends Manifest {
  readonly name?: undefined
  readonly version?: undefined
  readonly private: true
  readonly description?: undefined
  readonly homepage?: undefined
  readonly license?: undefined
  readonly author?: undefined
  readonly repository?: undefined
  readonly bugs?: undefined
  readonly main?: undefined
  readonly types?: undefined
  readonly dependencies?: DependencyDict
  readonly devDependencies?: undefined
  readonly peerDependencies?: undefined
  readonly optionalDependencies?: undefined
  readonly scripts?: undefined
}

export interface ToolManifest extends Manifest {
  readonly name: string
  readonly version: '0.0.0'
  readonly private: true
  readonly description?: undefined
  readonly homepage?: undefined
  readonly license?: undefined
  readonly author?: undefined
  readonly repository?: undefined
  readonly bugs?: undefined
  readonly dependencies?: DependencyDict
  readonly devDependencies?: undefined
  readonly peerDependencies?: undefined
  readonly optionalDependencies?: undefined
  readonly scripts?: undefined
}

export const enum ManifestType {
  Root = 'Root',
  Package = 'Package',
  Test = 'Test',
  Tool = 'Tool'
}

export function getContainerFromManifestType (manifestType: ManifestType): string {
  switch (manifestType) {
    case ManifestType.Root:
      return places.project
    case ManifestType.Package:
      return places.packages
    case ManifestType.Test:
      return places.test
    case ManifestType.Tool:
      return places.tools
  }
}

export function getManifestTypeFromContainer (container: string): ManifestType | null {
  switch (container) {
    case places.project:
      return ManifestType.Root
    case places.packages:
      return ManifestType.Package
    case places.test:
      return ManifestType.Test
    case places.tools:
      return ManifestType.Tool
    default:
      return null
  }
}

export function getManifestTypeFromPath (filename: string): ManifestType | null {
  if (filename.startsWith(places.project)) return ManifestType.Root
  if (filename.startsWith(places.packages)) return ManifestType.Package
  if (filename.startsWith(places.test)) return ManifestType.Test
  if (filename.startsWith(places.tools)) return ManifestType.Tool
  return null
}

interface GenericLoadedResult {
  readonly type: ManifestType | null
  readonly manifest: Manifest
}

interface RootLoadedResult extends GenericLoadedResult {
  readonly type: ManifestType.Root
  readonly manifest: RootManifest
}

interface PackageLoadedResult extends GenericLoadedResult {
  readonly type: ManifestType.Package
  readonly manifest: PackageManifest
}

interface TestLoadedResult extends GenericLoadedResult {
  readonly type: ManifestType.Test
  readonly manifest: TestManifest
}

interface ToolLoadedResult extends GenericLoadedResult {
  readonly type: ManifestType.Tool
  readonly manifest: ToolManifest
}

interface UnknownLoadedResult extends GenericLoadedResult {
  readonly type: null
}

type LoadedResult =
  RootLoadedResult |
  PackageLoadedResult |
  TestLoadedResult |
  ToolLoadedResult |
  UnknownLoadedResult

export function loadManifest (filename: string): LoadedResult {
  const { base } = path.parse(filename)
  if (base !== 'package.json') throw new RangeError(`Invalid file name: ${base}`)
  const type = getManifestTypeFromPath(filename)
  const manifest = require(filename)
  return { type, manifest }
}

export const rootManifestPath = path.join(places.project, 'package.json')

export function loadRootManifest (): RootManifest {
  return require(rootManifestPath)
}

interface Loader<Return> {
  (name: string): Return
}

function Loader<Return> (container: string): Loader<Return> {
  return name => {
    const filename = path.join(container, name, 'package.json')
    return require(filename)
  }
}

export const loadPackageManifest = Loader<PackageManifest>(places.packages)
export const loadTestManifest = Loader<TestManifest>(places.packages)
export const loadToolManifest = Loader<ToolManifest>(places.packages)

export async function writeManifest<Obj extends Manifest> (filename: string, manifest: Obj) {
  await writeJSON(filename, manifest)
}

interface Writer<Obj extends Manifest> {
  (name: string, manifest: Obj): Promise<void>
}

function Writer<Obj extends Manifest> (container: string): Writer<Obj> {
  return (name, manifest) => {
    const filename = path.join(container, name, 'package.json')
    return writeManifest(filename, manifest)
  }
}

export const writePackageManifest = Writer<PackageManifest>(places.packages)
export const writeTestManifest = Writer<TestManifest>(places.test)
export const writeToolManifest = Writer<ToolManifest>(places.tools)
