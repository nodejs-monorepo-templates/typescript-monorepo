import path from 'path'
import { prompt } from 'inquirer'
import {
  Manifest,
  ManifestType,
  PackageManifest,
  ToolManifest,
  ManifestItem,
  ManifestList,
  NonRootManifestTypes,
  loadPackageList,
  loadTestList,
  loadToolList,
} from '@tools/utils'

async function promptManifestType(): Promise<NonRootManifestTypes.Union> {
  const { type } = await prompt({
    name: 'type',
    message: 'Dependant container',
    type: 'list',
    choices: NonRootManifestTypes
      .map(value => ({ name: value.toLowerCase(), value })),
  })

  return type
}

interface GetVersionRequirementParam {
  readonly item: ManifestItem<PackageManifest | ToolManifest>
  readonly manifest: PackageManifest | ToolManifest
}

async function addProdDeps<Obj extends Manifest>(
  target: ManifestItem<Obj>,
  packages: readonly ManifestItem<PackageManifest | ToolManifest>[],
  getVersionRequirement: (param: GetVersionRequirementParam) => string,
) {
  if (!packages.length) return

  const [
    manifest,
    dependencies,
  ] = await Promise.all([
    target.readManifestOnce(),
    Promise.all(packages.map(async item => ({
      item,
      manifest: await item.readManifestOnce(),
    }))),
  ])

  if (!manifest.dependencies) {
    // @ts-ignore
    manifest.dependencies = {}
  }

  for (const param of dependencies) {
    const version = getVersionRequirement(param)
    // @ts-ignore
    manifest.dependencies[param.manifest.name] = version
  }

  await target.writeManifest(manifest)
}

export async function handlePackage() {
  const list = await loadPackageList()
  const target = await list.promptItem('Choose a package')
  const dependencies = await list.promptItemList('Choose dependencies')

  await addProdDeps(
    target,
    dependencies.items(),
    param => '^' + param.manifest.version,
  )
}

export async function handleTest() {
  const [
    testList,
    packageList,
  ] = await Promise.all([
    loadTestList(),
    loadPackageList(),
  ])

  const target = await testList.promptItem('Choose a folder')
  const dependencies = await packageList.promptItemList('Choose packages')

  await addProdDeps(
    target,
    dependencies.items(),
    param => 'file:' + path.relative(target.folder, param.item.folder),
  )
}

async function joinToolPackage(
  toolList: ManifestList<ToolManifest>,
  packageList: ManifestList<PackageManifest>,
): Promise<ManifestItem<PackageManifest | ToolManifest>[]> {
  const entries = await Promise.all(
    [...packageList.values(), ...toolList.values()]
      .map(async item => ({
        item,
        manifest: await item.readManifestOnce(),
      })),
  )

  const { dependencies } = await prompt({
    name: 'dependencies',
    message: 'Choose dependencies',
    type: 'checkbox',
    choices: entries.map(x => ({
      name: x.manifest.name,
      value: Object.assign(x.item),
    })),
  })

  return dependencies
}

export async function handleTool() {
  const [
    toolList,
    packageList,
  ] = await Promise.all([
    loadToolList(),
    loadPackageList(),
  ])

  const target = await toolList.promptItem('Choose a folder')
  const dependencies = await joinToolPackage(toolList, packageList)

  await addProdDeps(
    target,
    dependencies,
    param => 'file:' + path.relative(target.folder, param.item.folder),
  )
}

export async function main() {
  switch (await promptManifestType()) {
    case ManifestType.Package:
      return handlePackage()
    case ManifestType.Test:
      return handleTest()
    case ManifestType.Tool:
      return handleTool()
  }
}

export default main
