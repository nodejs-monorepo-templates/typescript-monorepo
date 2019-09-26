import path from 'path'
import process from 'process'
import { ensureFile, writeFile, pathExists } from 'fs-extra'
import { Application } from 'typedoc'
import places from '@tools/places'
import { loadPackageList } from '@tools/utils'
import { Child, homepage } from './homepage'

export async function main () {
  const failures = []

  await ensureFile(path.join(places.docs, '.nojekyll'))

  const list = await loadPackageList()
  const items = list.items()

  {
    const childrenPromises = items.map(async (item): Promise<Child> => {
      const { name, version, description = '' } = await item.readManifestOnce()
      const route = `${item.name}/index.html`
      const npm = `https://www.npmjs.com/package/${name}`
      return { name, version, description, route, npm }
    })

    const homepageHTML = homepage({
      title: 'Documentation',
      children: await Promise.all(childrenPromises)
    })

    console.info('docs> Home Page')
    await writeFile(path.join(places.docs, 'index.html'), homepageHTML)
  }

  for (const item of items) {
    console.info('docs>', item.name)

    const outputDir = path.join(places.docs, item.name)

    const readme = path.join(item.folder, 'README.md')
    const readmeObject = await pathExists(readme) ? { readme } : null

    const app = new Application({
      tsconfig: path.join(places.packages, 'tsconfig.json'),
      ignoreCompilerErrors: true,
      target: 'esnext',
      module: 'commonjs',
      experimentalDecorators: true,
      exclude: ['**/node_modules', '**/.git'],
      ...readmeObject
    })

    const project = app.convert(app.expandInputFiles([item.folder]))

    if (!project) {
      failures.push(item)
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
