import path from 'path'
import process from 'process'
import chalk from 'chalk'
import * as places from '@tools/places'
import { commands, enums, functions } from '../index'
const { ExitStatusCode } = enums
const { spawnSync } = functions
const [cmd, ...argv] = process.argv.slice(2)

type MaybePromise<X> = X | Promise<X>

class Command<Return extends MaybePromise<void>> {
  constructor (
    public readonly describe: string,
    public readonly act: (args: readonly string[]) => Return
  ) {}
}

type CommandName = Exclude<keyof Dict, 'mkspawn' | 'callCmd' | 'isCmd'>

abstract class Dict {
  protected abstract mkspawn (script: string, ...args: string[]): () => void
  protected abstract callCmd (command: CommandName, ...args: string[]): MaybePromise<void>
  protected abstract isCmd (command: string): command is CommandName

  public readonly help = new Command(
    'Print usage',
    () => {
      const title = (text: string) => console.info('\n' + chalk.bold(text))
      const member = (key: string, value: string) => console.info(`  ${key}: ${chalk.dim(value)}`)

      title('Usage:')
      console.info('  $ execute <command> [args]')

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

  public readonly glob = new Command(
    'Run command on files that match glob',
    async ([cmd, ...args]): Promise<void> => {
      const { default: glob2regex } = await import('glob-to-regexp')

      if (!cmd) {
        printError('Missing command')
        return process.exit(ExitStatusCode.InsufficientArguments)
      }

      if (!this.isCmd(cmd)) {
        printError(`Unknown Command: ${cmd}`)
        return process.exit(ExitStatusCode.UnknownCommand)
      }

      const regexes = args
        .map(glob => glob2regex(glob, { globstar: true, extended: true }))
        .map(glob => glob.source)

      this.callCmd(cmd, ...regexes)
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
    async args => {
      await this.callCmd('clean')
      await this.callCmd('jest', '--coverage', ...args)
    }
  )

  public readonly build = new Command(
    'Build all products',
    async () => {
      await this.callCmd('buildDocs')
      await this.callCmd('buildTypescript')
      await this.callCmd('tripleSlashDirective')
    }
  )

  public readonly clean = new Command(
    'Clean build products',
    async () => {
      await this.callCmd('cleanDocs')
      await this.callCmd('cleanTypescriptBuild')
    }
  )

  public readonly prepublish = new Command(
    'Commands that run before publishing packages',
    async () => {
      await this.callCmd('createIgnoreFiles')
      await this.callCmd('mismatches')
      await this.callCmd('testAll')
      await this.callCmd('build')
    }
  )

  public readonly publish = new Command(
    'Publish packages versions that have yet to publish',
    async args => {
      await this.callCmd('prepublish')

      console.info('Publishing packages...')
      spawnSync(
        commands.workspace,
        'publish',
        places.packages,
        ...args
      ).exit.onerror()

      await this.callCmd('publishDocs')
      await this.callCmd('postpublish')
    }
  )

  public readonly postpublish = new Command(
    'Commands that run after publishing packages',
    () => this.callCmd('clean')
  )

  public readonly createIgnoreFiles = new Command(
    'Create .npmignore files in every packages',
    args => {
      spawnSync(
        'node',
        require.resolve('@tools/ignore-file/bin/write'),
        ...args
      ).exit.onerror()
    }
  )

  public readonly testAll = new Command(
    'Run all tests in production mode',
    () => this.callCmd('test', '--ci', '--no-cache')
  )

  public readonly testWithoutCoverage = new Command(
    'Run tests',
    async args => {
      await this.callCmd('clean')
      await this.callCmd('jest', ...args)
    }
  )

  public readonly buildTypescript = new Command(
    'Compile TypeScript files',
    this.mkspawn(
      commands.typescript,
      '--project',
      path.resolve(places.packages, 'tsconfig.prod.json')
    )
  )

  public readonly tripleSlashDirective = new Command(
    'Add references to TypeScript definitions for JavaScript files',
    async () => {
      const { main } = await import('@tools/triple-slash-directive')
      await main()
    }
  )

  public readonly buildDocs = new Command(
    'Generate documentation from jsdoc comments',
    async () => {
      const { main } = await import('@tools/docs')
      await main()
    }
  )

  public readonly cleanTypescriptBuild = new Command(
    'Clean TSC build products',
    this.mkspawn(commands.cleanTypescriptBuild)
  )

  public readonly cleanDocs = new Command(
    'Delete docs folder',
    async () => {
      const { remove } = await import('fs-extra')
      console.info('Deleting', places.docs)
      await remove(places.docs)
    }
  )

  public readonly cleanGhPages = new Command(
    'Clean gh-pages cache',
    async () => {
      const { clean } = await import('@tools/gh-pages')
      console.info('Cleaning gh-pages cache...')
      clean()
    }
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

  public readonly jest = new Command(
    'Run tests',
    this.mkspawn(commands.jest)
  )

  public readonly publishDocs = new Command(
    'Publish documentation to gh-pages',
    this.mkspawn(commands.publishDocs)
  )

  public readonly updateDocs = new Command(
    'Rebuild and publish documentation to gh-pages',
    async () => {
      await this.callCmd('cleanDocs')
      await this.callCmd('buildDocs')
      await this.callCmd('publishDocs')
    }
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

async function main (cmd?: string, argv: readonly string[] = []) {
  class PrvDict extends Dict {
    mkspawn (...args: [string, ...string[]]) {
      // @ts-ignore
      return () => spawnSync('node', ...args, ...argv).exit.onerror()
    }

    async callCmd (cmd: CommandName, ...args: string[]) {
      console.info(chalk.italic.underline.dim('@call'), chalk.bold(cmd), ...args)
      await main(cmd, args)
    }

    isCmd (cmd: string): cmd is CommandName {
      return Object.keys(this).includes(cmd)
    }
  }

  const dict = new PrvDict()

  if (!cmd) {
    dict.help.act(argv)
    printError('Insufficient Arguments')
    return process.exit(ExitStatusCode.InsufficientArguments)
  }

  if (dict.isCmd(cmd)) {
    const command = dict[cmd]
    if (command instanceof Command) {
      return command.act(argv)
    }
  }

  printError(`Unknown command: ${cmd}`)
  return process.exit(ExitStatusCode.UnknownCommand)
}

void main(cmd, argv).catch(error => {
  console.error(error)
  return process.exit(ExitStatusCode.FatalError)
})
