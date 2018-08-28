'use strict'
const path = require('path')
const process = require('process')
const fsx = require('fs-extra')
const fsTreeUtils = require('fs-tree-utils')
const tsDir = path.resolve(__dirname, '../../typescript')

async function main () {
  const list = await fsTreeUtils.traverse(
    tsDir,
    {
      deep: x => x.item !== 'node_modules',
      stat: x => fsx.lstat(x)
    }
  )

  await Promise.all(
    list
      .filter(x => x.level > 0 && x.stats.isFile() && !/\.inrepo/.test(x.item))
      .filter(x => [/\.js$/, /\.d\.ts$/, /\.js\.map$/].some(xx => xx.test(x.item)))
      .map(x => fsx.unlink(x.path).then(() => console.info(`  --> Deleted ${x.path}`)))
  )

  return 0
}

main().then(
  status => {
    status && console.error(`Status: ${status}`)
    process.exit(status)
  },
  error => {
    console.error(error)
    process.exit(1)
  }
)
