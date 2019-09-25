import path from 'path'
import process from 'process'
import { ensureDir, pathExists } from 'fs-extra'
import { Application } from 'typedoc'
import places from '@tools/places'
import { loadPackageList } from '@tools/utils'

export async function main () {
  const failures = []

  await ensureDir(places.docs)

  const list = await loadPackageList()
  for (const item of list.items()) {
    console.info('docs>', item.name)

    const outputDir = path.join(places.docs, item.name)

    const readme = path.join(item.folder, 'README.md')
    const readmeObject = await pathExists(readme) ? { readme } : null

    const app = new Application({
      target: 'esnext',
      module: 'commonjs',
      experimentalDecorators: true,
      logger: 'none',
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
