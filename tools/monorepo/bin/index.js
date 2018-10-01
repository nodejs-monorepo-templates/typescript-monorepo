#! /usr/bin/env node
const process = require('process')
const chalk = require('chalk').default
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
      const title = text => console.info('\n' + chalk.bold(text))
      const member = (key, value) => console.info(`  ${key}: ${chalk.dim(value)}`)

      title('Usage:')
      console.info('  $ monorepo <command> [args]')

      title('Commands:')
      for (const [subCmd, { describe }] of Object.entries(dict)) {
        member(subCmd, describe)
      }

      title('Exit Status Codes:')
      for (const [name, code] of Object.entries(ExitStatusCode)) {
        member(code, name)
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

const printError = message =>
  console.error(chalk.red('[ERROR]'), message, '\n')

if (!cmd) {
  dict.help.act()
  printError('Insufficient Arguments')
  process.exit(ExitStatusCode.InsufficientArguments)
} else if (cmd in dict) {
  dict[cmd].act()
} else {
  printError(`Unknown command: ${cmd}`)
  process.exit(ExitStatusCode.UnknownCommand)
}
