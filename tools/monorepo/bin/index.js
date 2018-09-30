#! /usr/bin/env node
const process = require('process')
const { spawnSync } = require('exec-inline')
const places = require('@tools/places')
const { commands } = require('../index')
const [cmd, ...argv] = process.argv.slice(2)

switch (cmd) {
  case 'mismatches':
    spawnSync(
      commands.nestedWorkspaceHelpder,
      'verman',
      'mismatches',
      places.project,
      ...argv
    )

    break
  default:
    console.error(`[ERROR] Unknown command ${cmd}`)
    process.exit(-1)
}
