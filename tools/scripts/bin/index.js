#! /usr/bin/env node
const path = require('path')
const process = require('process')
const chalk = require('chalk').default
const { spawnSync } = require('exec-inline')
const places = require('@tools/places')
const { commands, enums } = require('../index')
const { ExitStatusCode } = enums
const [cmd, ...argv] = process.argv.slice(2)

const mkspawn = (...args) => () => spawnSync('node', ...args, ...argv).exit.onerror()
const callCmd = (cmd, ...args) => spawnSync('node', __filename, cmd, ...args).exit.onerror()

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
    act: mkspawn(commands.workspace)
  },

  mismatches: {
    describe: 'Check for mismatched versions',

    act: mkspawn(
      commands.workspace,
      'verman',
      'mismatches',
      places.packages
    )
  },

  test: {
    describe: 'Run tests',

    act () {
      callCmd('clean')

      spawnSync(
        'node',
        commands.jest,
        '--coverage',
        ...argv
      ).exit.onerror()
    }
  },

  build: {
    describe: 'Build all products',

    act () {
      callCmd('buildTypescript')
    }
  },

  clean: {
    describe: 'Clean build products',

    act () {
      callCmd('cleanTypescriptBuild')
    }
  },

  prepublish: {
    describe: 'Commands that run before publishing packages',

    act () {
      callCmd('createIgnoreFiles')
      callCmd('mismatches')
      callCmd('testAll')
      callCmd('build')
    }
  },

  publish: {
    describe: 'Publish packages versions that have yet to publish',

    act () {
      callCmd('prepublish')

      console.info('Publishing packages...')
      spawnSync(
        commands.workspace,
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

  testAll: {
    describe: 'Run all tests in production mode',

    act () {
      spawnSync('pnpm', 'test', '--', '--ci').exit.onerror()
    }
  },

  buildTypescript: {
    describe: 'Compile TypeScript files',
    act: mkspawn(
      commands.typescript,
      '--project',
      path.resolve(places.project, 'tsconfig.json')
    )
  },

  cleanTypescriptBuild: {
    describe: 'Clean TSC build products',
    act: mkspawn(commands.cleanTypescriptBuild)
  },

  runPreloadedNode: {
    describe: 'Run node with registered modules',
    act: mkspawn(commands.preloadedNode)
  },

  runStandardJS: {
    describe: 'Lint JavaScript codes with StandardJS',
    act: mkspawn(commands.standardjs)
  },

  runTSLint: {
    describe: 'Lint TypeScript codes with TSLint',
    act: mkspawn(commands.tslint)
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
