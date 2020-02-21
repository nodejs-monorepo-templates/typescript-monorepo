import path from 'path'
import process from 'process'
import { ensureFile, writeFile, pathExists } from 'fs-extra'
import { Application } from 'typedoc'
import { ScriptTarget, ModuleKind } from 'typescript'
import { partition } from '@tsfun/array'
import places from '@tools/places'
import { loadPackageList, loadRepoUrl } from '@tools/utils'
import * as config from './config'
import combineGlobPatterns from './combine-glob-patterns'
import { Child, homepage } from './homepage'

async function propIfExists<Key extends string> (
  key: Key,
  basename: string,
  folder = '.'
): Promise<{ [_ in Key]: string } | null> {
  if (!await pathExists(path.join(folder, basename))) return null
  return { [key]: basename } as any
}

export async function main () {
  const isIgnored = combineGlobPatterns(config.ignoredPackages)
  const failures = []

  await ensureFile(path.join(places.docs, '.nojekyll'))

  const list = await loadPackageList()
  const [ignored, items] = partition(list.items(), item => isIgnored(item.name))

  {
    const childrenPromises = items.map(async (item): Promise<Child> => {
      const { name, version, description = '' } = await item.readManifestOnce()
      const route = `${item.name}/index.html`
      const npm = `https://www.npmjs.com/package/${name}`
      return { name, version, description, route, npm }
    })

    const homepageHTML = homepage({
      title: config.title,
      children: await Promise.all(childrenPromises),
      repo: await loadRepoUrl()
    })

    console.info('docs> Home Page')
    await writeFile(path.join(places.docs, 'index.html'), homepageHTML)
  }

  for (const item of ignored) {
    const { default: chalk } = await import('chalk')
    const { name } = await item.readManifestOnce()
    const message = chalk.dim(`docs> ${chalk.strikethrough(name)} [SKIPPED]`)
    console.info(message)
  }

  for (const item of items) {
    const { name } = await item.readManifestOnce()

    console.info('docs>', name)

    const outputDir = path.join(places.docs, item.name)

    const readmeObject = await propIfExists('readme', path.join(item.folder, 'README.md'))

    const app = new Application()
    const { hasErrors } = app.bootstrap({
      tsconfig: path.join(places.packages, 'tsconfig.json'),
      ignoreCompilerErrors: true,
      // TODO LATER: Remove 'as any' when https://github.com/TypeStrong/typedoc/issues/1213 is resolved
      target: ScriptTarget.ESNext as any,
      // TODO LATER: Remove 'as any' when https://github.com/TypeStrong/typedoc/issues/1213 is resolved
      module: ModuleKind.CommonJS as any,
      mode: 'file',
      excludeExternals: false,
      excludeNotExported: true,
      excludePrivate: true,
      exclude: ['**/node_modules', '**/.git'],
      logger: 'none',
      name: `${name} — Reference`,
      ...readmeObject
    })
    if (hasErrors) {
      console.error('[ERROR] Failed to bootstrap typedoc')
      throw process.exit(2)
    }

    const entryFilePath = path.join(item.folder, 'index.ts')
    const project = app.convert(app.expandInputFiles([
      await pathExists(entryFilePath)
        ? entryFilePath
        : item.folder
    ]))

    if (!project) {
      failures.push(item)
      console.error('Failed to generate docs for', item.name)
      continue
    }

    app.generateDocs(project, outputDir)
  }

  if (failures.length) {
    console.error()
    console.error('[ERROR] Failed to generate docs for:')

    for (const item of failures) {
      console.error(' -', item.name)
    }

    throw process.exit(1)
  }
}

export default main
