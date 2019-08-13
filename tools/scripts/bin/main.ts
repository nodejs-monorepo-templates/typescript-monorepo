import path from 'path'
import process from 'process'
import chalk from 'chalk'
import * as places from '@tools/places'
import { commands, enums, functions } from '../index'
const script = require.resolve('./index.js')
const { ExitStatusCode } = enums
const { spawnSync } = functions
const [cmd, ...argv] = process.argv.slice(2)

main(cmd, argv)

function main (cmd: string, argv: readonly string[]) {
  function mkspawn (...args: [string, ...string[]]) {
    // @ts-ignore
    return () => spawnSync('node', ...args, ...argv).exit.onerror()
  }

  function callCmd (cmd: keyof typeof dict, ...args: string[]) {
    console.info(chalk.italic.underline.dim('@call'), chalk.bold(cmd), ...args)
    main(cmd, args)
  }

  class Command {
    constructor (
      public readonly describe: string,
      public readonly act: () => void
    ) {}
  }

  class Dict {
    public readonly help = new Command(
      'Print usage',
      () => {
        const title = (text: string) => console.info('\n' + chalk.bold(text))
        const member = (key: string, value: string) => console.info(`  ${key}: ${chalk.dim(value)}`)

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
    )

    public readonly workspace = new Command(
      'Invoke nested-workspace-helper',
      mkspawn(commands.workspace)
    )

    public readonly mismatches = new Command(
      'Check for mismatched versions',
      mkspawn(
        commands.workspace,
        'verman',
        'mismatches',
        places.packages
      )
    )

    public readonly test = new Command(
      'Run tests',
      () => {
        callCmd('clean')

        spawnSync(
          'node',
          commands.jest,
          '--coverage',
          ...argv
        ).exit.onerror()
      }
    )

    public readonly build = new Command(
      'Build all products',
      () => callCmd('buildTypescript')
    )

    public readonly clean = new Command(
      'Clean build products',
      () => callCmd('cleanTypescriptBuild')
    )

    public readonly prepublish = new Command(
      'Commands that run before publishing packages',
      () => {
        callCmd('createIgnoreFiles')
        callCmd('mismatches')
        callCmd('testAll')
        callCmd('build')
      }
    )

    public readonly publish = new Command(
      'Publish packages versions that have yet to publish',
      () => {
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
    )

    public readonly postpublish = new Command(
      'Commands that run after publishing packages',
      () => callCmd('clean')
    )

    public readonly createIgnoreFiles = new Command(
      'Create .npmignore files in every packages',
      () => {
        spawnSync(
          'node',
          require.resolve('@tools/ignore-file/bin/write'),
          ...argv
        ).exit.onerror()
      }
    )

    public readonly testAll = new Command(
      'Run all tests in production mode',
      () => callCmd('test', '--ci')
    )

    public readonly buildTypescript = new Command(
      'Compile TypeScript files',
      mkspawn(
        commands.typescript,
        '--project',
        path.resolve(places.packages, 'tsconfig.json')
      )
    )

    public readonly cleanTypescriptBuild = new Command(
      'Clean TSC build products',
      mkspawn(commands.cleanTypescriptBuild)
    )

    public readonly gitTagVersions = new Command(
      'Create tags for every package based on their current version',
      mkspawn(commands.gitTagVersions)
    )

    public readonly runPreloadedNode = new Command(
      'Run node with registered modules',
      mkspawn(commands.preloadedNode)
    )

    public readonly runStandardJS = new Command(
      'Lint JavaScript codes with StandardJS',
      mkspawn(commands.standardjs)
    )

    public readonly runTSLint = new Command(
      'Lint TypeScript codes with TSLint',
      mkspawn(commands.tslint)
    )

    public readonly new = new Command(
      'Create new folder',
      async () => {
        const { main } = require('@tools/create-new-folder')
        await main()
      }
    )
  }

  const dict = new Dict()

  function printError (message: string) {
    console.error(chalk.red('[ERROR]'), message, '\n')
  }

  if (!cmd) {
    dict.help.act()
    printError('Insufficient Arguments')
    process.exit(ExitStatusCode.InsufficientArguments)
  } else if (cmd in dict) {
    dict[cmd as keyof typeof dict].act()
  } else {
    printError(`Unknown command: ${cmd}`)
    process.exit(ExitStatusCode.UnknownCommand)
  }
}
