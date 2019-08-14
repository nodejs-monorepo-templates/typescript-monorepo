import path from 'path'
import { prompt } from 'inquirer'
import {
  Manifest,
  ManifestType,
  PackageManifest,
  TestManifest,
  ToolManifest,
  ManifestItem,
  ManifestList,
  NonRootManifestTypes,
  loadPackageList,
  loadTestList,
  loadToolList
} from '@tools/utils'

async function promptManifestType (): Promise<NonRootManifestTypes.Union> {
  const { type } = await prompt({
    name: 'type',
    message: 'Dependant container',
    type: 'list',
    choices: NonRootManifestTypes
      .map(value => ({ name: value.toLowerCase(), value }))
  })

  return type
}

interface GetVersionRequirementParam {
  readonly item: ManifestItem<PackageManifest>
  readonly manifest: PackageManifest
}

async function addProdDeps<Obj extends Manifest> (
  target: ManifestItem<Obj>,
  packages: ManifestList<PackageManifest>,
  getVersionRequirement: (param: GetVersionRequirementParam) => string
) {
  if (!packages.size) return

  const [
    manifest,
    dependencies
  ] = await Promise.all([
    target.readManifest(),
    Promise.all(packages.items().map(async item => ({
      item,
      manifest: await item.readManifest()
    })))
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

export async function handlePackage () {
  const list = await loadPackageList()
  const target = await list.promptItem('Choose a package')
  const dependencies = await list.promptItemList('Choose dependencies')
  await addProdDeps(target, dependencies, param => '^' + param.manifest.version)
}

async function handleTestOrTool<Manifest extends TestManifest | ToolManifest> (
  loadTargetList: () => Promise<ManifestList<Manifest>>
) {
  const [
    targetList,
    packageList
  ] = await Promise.all([
    loadTargetList(),
    loadPackageList()
  ])

  const target = await targetList.promptItem('Choose a folder')
  const dependencies = await packageList.promptItemList('Choose packages')

  await addProdDeps(
    target,
    dependencies,
    param => path.relative(target.folder, param.item.folder)
  )
}

export async function handleTest () {
  await handleTestOrTool(loadTestList)
}

export async function handleTool () {
  await handleTestOrTool(loadToolList)
}

export async function main () {
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
