#! /usr/bin/env node
const process = require('process')
const { spawnSync } = require('exec-inline')
const places = require('@tools/places')
const { commands } = require('../index')
const [cmd, ...argv] = process.argv.slice(2)

const dict = {
  help: {
    describe: 'Print usage',

    act () {
      console.info('Usage:')
      console.info('  $ monorepo <command> [args]')
      console.info()
      console.info('Commands:')

      for (const [subCmd, { describe }] of Object.entries(dict)) {
        console.info(`  - ${subCmd}: ${describe}`)
      }
    }
  },

  mismatches: {
    describe: 'Check for mismatched versions',

    act: spawnSync.bind(null, [
      commands.nestedWorkspaceHelpder,
      'verman',
      'mismatches',
      places.project,
      ...argv
    ])
  }
}

if (!cmd) {
  dict.help.act()
  process.exit(1)
} else if (cmd in dict) {
  for (const [subCmd, { act }] of Object.entries(dict)) {
    if (cmd !== subCmd) continue
    act()
    break
  }
} else {
  console.error(`[ERROR] Unknown command: ${cmd}`)
  process.exit(2)
}
