import path from 'path'
import process from 'process'
import chalk from 'chalk'
import * as places from '@tools/places'
import { commands, enums, functions } from '../index'
const { ExitStatusCode } = enums
const { spawnSync } = functions
const [cmd, ...argv] = process.argv.slice(2)

class Command {
  constructor (
    public readonly describe: string,
    public readonly act: () => void
  ) {}
}

type CommandName = Exclude<keyof Dict, 'mkspawn' | 'callCmd'>

abstract class Dict {
  protected abstract mkspawn (script: string, ...args: string[]): () => void
  protected abstract callCmd (command: CommandName, ...args: string[]): void

  public readonly help = new Command(
    'Print usage',
    () => {
      const title = (text: string) => console.info('\n' + chalk.bold(text))
      const member = (key: string, value: string) => console.info(`  ${key}: ${chalk.dim(value)}`)

      title('Usage:')
      console.info('  $ monorepo <command> [args]')

      title('Commands:')
      for (const [key, value] of Object.entries(this)) {
        if (value instanceof Command) member(key, value.describe)
      }

      title('Exit Status Codes:')
      for (const [name, code] of Object.entries(ExitStatusCode)) {
        if (typeof code === 'number') member(String(code), name)
      }

      console.info()
    }
  )

  public readonly workspace = new Command(
    'Invoke nested-workspace-helper',
    this.mkspawn(commands.workspace)
  )

  public readonly mismatches = new Command(
    'Check for mismatched versions',
    this.mkspawn(
      commands.workspace,
      'verman',
      'mismatches',
      places.packages
    )
  )

  public readonly test = new Command(
    'Run tests',
    () => {
      this.callCmd('clean')

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
    () => this.callCmd('buildTypescript')
  )

  public readonly clean = new Command(
    'Clean build products',
    () => this.callCmd('cleanTypescriptBuild')
  )

  public readonly prepublish = new Command(
    'Commands that run before publishing packages',
    () => {
      this.callCmd('createIgnoreFiles')
      this.callCmd('mismatches')
      this.callCmd('testAll')
      this.callCmd('build')
    }
  )

  public readonly publish = new Command(
    'Publish packages versions that have yet to publish',
    () => {
      this.callCmd('prepublish')

      console.info('Publishing packages...')
      spawnSync(
        commands.workspace,
        'publish',
        places.packages,
        ...argv
      ).exit.onerror()

      this.callCmd('postpublish')
    }
  )

  public readonly postpublish = new Command(
    'Commands that run after publishing packages',
    () => this.callCmd('clean')
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
    () => this.callCmd('test', '--ci')
  )

  public readonly buildTypescript = new Command(
    'Compile TypeScript files',
    this.mkspawn(
      commands.typescript,
      '--project',
      path.resolve(places.packages, 'tsconfig.json')
    )
  )

  public readonly cleanTypescriptBuild = new Command(
    'Clean TSC build products',
    this.mkspawn(commands.cleanTypescriptBuild)
  )

  public readonly gitTagVersions = new Command(
    'Create tags for every package based on their current version',
    this.mkspawn(commands.gitTagVersions)
  )

  public readonly publishTagPush = new Command(
    'Publish every new package; Add git tags; Push changes to remote',
    this.mkspawn(commands.publishTagPush)
  )

  public readonly runPreloadedNode = new Command(
    'Run node with registered modules',
    this.mkspawn(commands.preloadedNode)
  )

  public readonly runStandardJS = new Command(
    'Lint JavaScript codes with StandardJS',
    this.mkspawn(commands.standardjs)
  )

  public readonly runTSLint = new Command(
    'Lint TypeScript codes with TSLint',
    this.mkspawn(commands.tslint)
  )

  public readonly new = new Command(
    'Create new folder',
    async () => {
      const { main } = await import('@tools/create-new-folder')
      await main()
    }
  )

  public readonly add = new Command(
    'Add dependencies',
    async () => {
      const { main } = await import('@tools/add-dependency')
      await main()
    }
  )
}

function printError (message: string) {
  console.error(chalk.red('[ERROR]'), message, '\n')
}

function main (cmd?: string, argv?: readonly string[]) {
  class PrvDict extends Dict {
    mkspawn (...args: [string, ...string[]]) {
      // @ts-ignore
      return () => spawnSync('node', ...args, ...argv).exit.onerror()
    }

    callCmd (cmd: CommandName, ...args: string[]) {
      console.info(chalk.italic.underline.dim('@call'), chalk.bold(cmd), ...args)
      main(cmd, args)
    }
  }

  const dict = new PrvDict()

  if (!cmd) {
    dict.help.act()
    printError('Insufficient Arguments')
    return process.exit(ExitStatusCode.InsufficientArguments)
  }

  if (cmd in dict) {
    const command = dict[cmd as keyof PrvDict]
    if (command instanceof Command) {
      return command.act()
    }
  }

  printError(`Unknown command: ${cmd}`)
  return process.exit(ExitStatusCode.UnknownCommand)
}

main(cmd, argv)
