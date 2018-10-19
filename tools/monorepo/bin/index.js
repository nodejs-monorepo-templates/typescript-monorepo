#! /usr/bin/env node
const process = require('process')
const chalk = require('chalk').default
const { spawnSync } = require('exec-inline')
const places = require('@tools/places')
const { commands, enums } = require('../index')
const { ExitStatusCode } = enums
const [cmd, ...argv] = process.argv.slice(2)

const mkspawn = (...args) => () => spawnSync('node', ...args, ...argv).exit.onerror()
const callCmd = (cmd, ...args) => spawnSync('node', __filename, cmd, ...args)

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
  },

  prepublish: {
    describe: 'Commands that run before publishing packages',

    act () {
      callCmd('createIgnoreFiles')
      callCmd('mismatches')
      callCmd('test')
      callCmd('build')
    }
  },

  publish: {
    describe: 'Publish packages versions that have yet to publish',

    act () {
      callCmd('prepublish')

      console.info('Publishing packages...')
      spawnSync(
        commands.nestedWorkspaceHelpder,
        'publish',
        places.packages,
        ...argv
      ).exit.onerror()

      callCmd('postpublish')
    }
  },

  postpublish: {
    describe: 'Commands that run after publishing packages',

    act () {
      spawnSync('pnpm', 'run', 'clean')
    }
  },

  createIgnoreFiles: {
    describe: 'Create .npmignore files in every packages',

    act () {
      console.info('[TODO] Implement createIgnoreFiles')
    }
  },

  test: {
    describe: 'Run all tests in production mode',

    act () {
      spawnSync('pnpm', 'test', '--', '--ci').exit.onerror()
    }
  },

  build: {
    describe: 'Compile TypeScript',

    act () {
      spawnSync('pnpm', 'run', 'build').exit.onerror()
    }
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
