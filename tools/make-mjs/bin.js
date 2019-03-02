#! /usr/bin/env node
const path = require('path')
const process = require('process')
const { rename } = require('fs-extra')
const { traverse } = require('fs-tree-utils')
const places = require('@tools/places')

async function main () {
  const list = await traverse(
    path.join(places.packages),
    {
      deep: x => !['node_modules', '.git'].includes(x.item)
    }
  )

  const renamingPromises = list
    .filter(x => x.stats.isFile())
    .map(({ path: oldPath }) => ({ oldPath, ...path.parse(oldPath) }))
    .filter(x => x.ext === '.js')
    .map(({ oldPath, dir, name }) => ({ oldPath, newPath: path.join(dir, name + '.mjs') }))
    .map(x => rename(x.oldPath, x.newPath).then(() => x))

  await Promise.all(renamingPromises)

  return 0
}

main().then(
  status => process.exit(status),
  error => {
    console.error(error)
    process.exit(1)
  }
)
