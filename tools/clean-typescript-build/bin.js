#! /usr/bin/env node
const { argv, exit } = require('process')
const { spawnSync } = require('child_process')
const projdir = require('@tools/places').project
const command = require.resolve('clean-typescript-build/bin/clean-typescript-build')

const { status } = spawnSync(
  'node',
  [command, projdir, ...argv.slice(2)],
  {
    stdio: 'inherit'
  }
)

exit(status)
