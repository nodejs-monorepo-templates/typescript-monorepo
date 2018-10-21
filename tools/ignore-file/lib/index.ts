import * as path from 'path'
import minimatch from 'minimatch'
import * as yaml from 'js-yaml'
import * as fsx from 'fs-extra'
import * as fsTreeUtils from 'fs-tree-utils'
import Traverse = fsTreeUtils.Traverse
import DeepFunc = Traverse.Options.DeepFunc

export type IgnoreArray = ReadonlyArray<string>
export type StringTester = string
export type IgnoreContainerPattern = StringTester
export type DeltaFileChooser = (ignoreFilePath: string) => ReadonlyArray<string>

export interface FilePair {
  readonly ignore: string
  readonly delta: ReadonlyArray<string>
}

export interface Delta {
  readonly prepend?: IgnoreArray
  readonly append?: IgnoreArray
  readonly remove?: IgnoreArray
}

export interface LoadedDelta {
  readonly filename: string
  readonly content: Delta
}

export interface DeltaPair {
  readonly ignore: string
  readonly delta: ReadonlyArray<LoadedDelta>
}

export namespace createFileChooser {
  export const byExt = (...extList: string[]): DeltaFileChooser => ignore => {
    const { base, dir, root } = path.parse(ignore)
    const segment = dir.split(/[/\\]/)
    const list = segment.map((_, i) => segment.slice(0, i + 1)).map(x => path.join(...x))

    const add = (ext: string) =>
      ext ? base + '.' + ext : base + '.dlt.yml'

    return extList
      .map(ext => add(ext.trim()))
      .map(basename => list.map(x => path.join(root, x, basename)))
      .reduce((prev, current) => [...prev, ...current], [])
  }
}

export const DEFAULT_CONTAINER_PATTERN: IgnoreContainerPattern = '**'
export const DEFAULT_DELTA_FILES_CHOOSER: DeltaFileChooser = createFileChooser.byExt('yaml', 'yml')
export const DEFAULT_TRAVERSE_DEEP: DeepFunc = x => x.item !== 'node_modules'

export function getArray (str: string): IgnoreArray {
  return str
    .split(/\n|\r/)
    .filter(Boolean)
    .filter(x => !/^#/.test(x))
}

export function getString (array: IgnoreArray): string {
  return array.join('\n') + '\n'
}

export async function getDeltaContent (filename: string): Promise<LoadedDelta> {
  if (fsx.existsSync(filename)) {
    const text = await fsx.readFile(filename, 'utf8')
    const content: Delta = { ...yaml.safeLoad(text) }
    return { filename, content }
  }

  return { filename, content: {} }
}

export function add (
  array: IgnoreArray,
  {
    prepend = [],
    append = [],
    remove = []
  }: Delta
): IgnoreArray {
  return [
    ...prepend,
    ...array,
    ...append
  ].filter(
    name => !remove.includes(name)
  )
}

export namespace add {
  export function multipleDeltas (array: IgnoreArray, addend: ReadonlyArray<Delta>) {
    return addend.reduce(
      (array, delta) => add(array, delta),
      array
    )
  }

  export function multipleLoadedDeltas (array: IgnoreArray, addend: ReadonlyArray<LoadedDelta>) {
    return multipleDeltas(array, addend.map(x => x.content))
  }
}

export async function getIgnoreFiles (
  basename: string,
  containerPattern = DEFAULT_CONTAINER_PATTERN,
  dirname = '.',
  deep = DEFAULT_TRAVERSE_DEEP
): Promise<IgnoreArray> {
  return (
    await fsTreeUtils.traverse(dirname, { deep })
  )
    .filter(x => x.stats.isDirectory() && minimatch(x.path, containerPattern, { dot: true }))
    .map(x => path.join(x.path, basename))
}

export async function getFilePairs (
  ignoreFileBasename: string,
  ignoreFileContainerPattern = DEFAULT_CONTAINER_PATTERN,
  dirname = '.',
  delta = DEFAULT_DELTA_FILES_CHOOSER,
  deep = DEFAULT_TRAVERSE_DEEP
): Promise<ReadonlyArray<FilePair>> {
  return (
    await getIgnoreFiles(ignoreFileBasename, ignoreFileContainerPattern, dirname, deep)
  ).map(ignore => ({
    ignore,
    delta: delta(ignore)
  }))
}

export async function getDeltaPairs (
  ignoreFileBasename: string,
  ignoreFileContainerPattern = DEFAULT_CONTAINER_PATTERN,
  dirname = '.',
  delta = DEFAULT_DELTA_FILES_CHOOSER,
  deep = DEFAULT_TRAVERSE_DEEP
): Promise<ReadonlyArray<DeltaPair>> {
  return Promise.all(
    (
      await getFilePairs(
        ignoreFileBasename,
        ignoreFileContainerPattern,
        dirname,
        delta,
        deep
      )
    ).map(
      async ({ delta, ignore }) => ({
        ignore,
        delta: await Promise.all(
          delta.map(getDeltaContent)
        )
      })
    )
  )
}

export async function writeIgnoreFiles (
  basefile: string,
  ignoreFileBasename: string,
  ignoreFileContainerPattern = DEFAULT_CONTAINER_PATTERN,
  dirname = '.',
  delta = DEFAULT_DELTA_FILES_CHOOSER,
  deep = DEFAULT_TRAVERSE_DEEP
) {
  const [base, list] = await Promise.all([
    fsx.readFile(basefile, 'utf8').then(getArray),
    getDeltaPairs(
      ignoreFileBasename,
      ignoreFileContainerPattern,
      dirname,
      delta,
      deep
    )
  ])

  await Promise.all(
    list.map(
      async x => x.ignore === basefile || (// Do not overwrite basefile
        fsx.writeFile(
          x.ignore,
          getString(add.multipleLoadedDeltas(base, x.delta))
        )
      )
    )
  )
}
