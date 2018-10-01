#! /usr/bin/env node
const process = require('process')
const { spawnSync } = require('exec-inline')
const places = require('@tools/places')
const { commands, enums } = require('../index')
const { ExitStatusCode } = enums
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
      console.info('Exit Status Codes:')
      for (const [name, code] of Object.entries(ExitStatusCode)) {
        console.info(`  - ${code}: ${name}`)
      }

      console.info()
    }
  },

  workspace: {
    describe: 'Invoke nested-workspace-helper',
    act: mkspawn(commands.nestedWorkspaceHelpder)
  },

  mismatches: {
    describe: 'Check for mismatched versions',

    act: mkspawn(
      commands.nestedWorkspaceHelpder,
      'verman',
      'mismatches',
      places.packages
    )
  }
}

if (!cmd) {
  dict.help.act()
  process.exit(ExitStatusCode.InsufficientArguments)
} else if (cmd in dict) {
  dict[cmd].act()
} else {
  console.error(`[ERROR] Unknown command: ${cmd}`)
  process.exit(ExitStatusCode.UnknownCommand)
}
