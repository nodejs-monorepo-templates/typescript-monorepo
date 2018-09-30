#! /usr/bin/env node
const process = require('process')
const { spawnSync } = require('exec-inline')
const places = require('@tools/places')
const { commands } = require('../index')
const [cmd, ...argv] = process.argv.slice(2)

const mkspawn = (...args) => () => spawnSync('node', ...args, ...argv).exit()

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

      console.info()
    }
  },

  workspace: {
    describe: 'Invoke nested-workspace-helper',

    act: mkspawn(
      'node',
      commands.nestedWorkspaceHelpder
    )
  },

  mismatches: {
    describe: 'Check for mismatched versions',

    act: mkspawn(
      'node',
      commands.nestedWorkspaceHelpder,
      'verman',
      'mismatches',
      places.packages
    )
  }
}

if (!cmd) {
  dict.help.act()
  process.exit(1)
} else if (cmd in dict) {
  dict[cmd].act()
} else {
  console.error(`[ERROR] Unknown command: ${cmd}`)
  process.exit(2)
}
