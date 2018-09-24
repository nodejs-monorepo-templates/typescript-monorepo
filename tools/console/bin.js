#! /usr/bin/env node
const path = require('path')
const { spawnSync } = require('child_process')
const process = require('process')
const glob = require('glob-promise')
const places = require('@tools/places')
const script = require.resolve('@tools/preloaded-node/bin')
const { NODE_PATH = '', ...envRest } = process.env
const oldNodePath = NODE_PATH.split(path.delimiter)

async function main () {
  const nodePathSuffix = await glob('packages/*/node_modules', {
    absolute: true,
    cwd: places.project
  })

  const newNodePath = [
    places.packages,
    ...oldNodePath,
    ...nodePathSuffix
  ]

  const { status } = spawnSync(
    'node',
    [
      script,
      '-r',
      require.resolve('./init.js'),
      ...process.argv.slice(2)
    ],
    {
      stdio: 'inherit',
      env: {
        NODE_PATH: newNodePath.join(path.delimiter),
        ...envRest
      }
    }
  )

  return status
}

main().then(
  status => process.exit(status),
  error => {
    console.error(error)
    process.exit(-1)
  }
)
