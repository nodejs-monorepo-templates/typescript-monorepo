import path from 'path'
import process from 'process'
import ramda from 'ramda'
import { ensureFile, writeFile, pathExists } from 'fs-extra'
import { Application } from 'typedoc'
import places from '@tools/places'
import { loadPackageList } from '@tools/utils'
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
  const [ignored, items] = ramda.partition(item => isIgnored(item.name), list.items())

  {
    const childrenPromises = items.map(async (item): Promise<Child> => {
      const { name, version, description = '' } = await item.readManifestOnce()
      const route = `${item.name}/index.html`
      const npm = `https://www.npmjs.com/package/${name}`
      return { name, version, description, route, npm }
    })

    const homepageHTML = homepage({
      title: config.title,
      children: await Promise.all(childrenPromises)
    })

    console.info('docs> Home Page')
    await writeFile(path.join(places.docs, 'index.html'), homepageHTML)
  }

  for (const item of ignored) {
    const { default: chalk } = await import('chalk')
    console.info(`docs> ${chalk.strikethrough(item.name)} [SKIPPED]`)
  }

  for (const item of items) {
    console.info('docs>', item.name)

    const outputDir = path.join(places.docs, item.name)

    const readmeObject = await propIfExists('readme', 'README.md', item.folder)
    const entryPointObject = await propIfExists('entryPoint', 'index.ts', item.folder)

    const { name } = await item.readManifestOnce()

    const app = new Application({
      tsconfig: path.join(places.packages, 'tsconfig.json'),
      ignoreCompilerErrors: true,
      target: 'esnext',
      module: 'commonjs',
      mode: 'file',
      excludeExternals: true,
      excludeNotExported: true,
      excludePrivate: true,
      exclude: ['**/node_modules', '**/.git'],
      entryPoint: 'index.ts',
      logger: 'none',
      name: `${name} — Reference`,
      ...readmeObject,
      ...entryPointObject
    })

    const project = app.convert(app.expandInputFiles([item.folder]))

    if (!project) {
      failures.push(item)
      console.error('Failed to generate docs for', item.name)
      continue
    }

    app.generateDocs(project, outputDir)
  }

  if (failures.length) {
    console.error()
    console.error('[ERROR]: Failed to generate docs for:')

    for (const item of failures) {
      console.error(' -', item.name)
    }

    throw process.exit(1)
  }
}

export default main
