import path from 'path'
import { readdir, readJSON, existsSync } from 'fs-extra'
import * as places from '@tools/places'
import writeJSON from '../write-json'
import {
  Manifest,
  PackageManifest,
  TestManifest,
  ToolManifest,
  ManifestType,
} from '../manifest'

export abstract class ManifestItem<Obj extends Manifest> {
  abstract readonly name: string
  abstract readonly folder: string
  abstract readonly manifest: string
  abstract readonly list: ManifestList<Obj>
  private manifestPromise: Promise<Obj> | undefined

  public async readManifest(): Promise<Obj> {
    this.manifestPromise = await readJSON(this.manifest)
    return this.manifestPromise!
  }

  public readManifestOnce(): Promise<Obj> {
    if (this.manifestPromise) return this.manifestPromise
    return this.readManifest()
  }

  public async writeManifest(manifest: Obj): Promise<void> {
    await writeJSON(this.manifest, manifest)
  }
}

export abstract class ManifestList<Obj extends Manifest> extends Map<string, ManifestItem<Obj>> {
  private promptChoices(): { name: string; value: ManifestItem<Obj> }[] {
    return this.items().map(value => ({ name: value.name, value }))
  }

  public names() {
    return Array.from(this.keys())
  }

  public items() {
    return Array.from(this.values())
  }

  public async promptItem(message: string): Promise<ManifestItem<Obj>> {
    const { prompt } = await import('inquirer')

    const { item } = await prompt({
      name: 'item',
      message,
      type: 'list',
      choices: this.promptChoices(),
    })

    return item
  }

  public async promptItemList(message: string): Promise<ManifestList<Obj>> {
    const { prompt } = await import('inquirer')

    const { list } = await prompt({
      name: 'list',
      message,
      type: 'checkbox',
      choices: this.promptChoices(),
    })

    return new class extends ManifestList<Obj> {}(
      (list as ManifestItem<Obj>[])
        .map(item => [item.name, item]),
    )
  }
}

interface ListLoader<Obj extends Manifest> {
  (): Promise<ManifestList<Obj>>
}

function ListLoader<Obj extends Manifest>(container: string): ListLoader<Obj> {
  class PrvList extends ManifestList<Obj> {
    constructor(directories: readonly string[]) {
      abstract class PrvItem extends ManifestItem<Obj> {
        get list() {
          return list
        }
      }

      super(
        directories
          .map(name =>
            new class extends PrvItem {
              name = name
              folder = path.join(container, name)
              manifest = path.join(container, name, 'package.json')
            }()
          )
          .filter(item => existsSync(item.manifest))
          .map(item => [item.name, item]),
      )

      const list = this
    }
  }

  return async () => new PrvList(await readdir(container))
}

export const loadPackageList = ListLoader<PackageManifest>(places.packages)
export const loadTestList = ListLoader<TestManifest>(places.test)
export const loadToolList = ListLoader<ToolManifest>(places.tools)

class ListLoaderDict {
  public readonly [ManifestType.Package] = loadPackageList
  public readonly [ManifestType.Test] = loadTestList
  public readonly [ManifestType.Tool] = loadToolList
}

export type NonRootManifestTypes = [
  ManifestType.Package,
  ManifestType.Test,
  ManifestType.Tool,
]
export const NonRootManifestTypes: NonRootManifestTypes = [
  ManifestType.Package,
  ManifestType.Test,
  ManifestType.Tool,
]
export namespace NonRootManifestTypes {
  export type Union = keyof ListLoaderDict
}

export const manifestListLoaders = new ListLoaderDict()
