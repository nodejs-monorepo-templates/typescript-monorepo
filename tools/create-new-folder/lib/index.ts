import path from 'path'
import { spawnSync } from 'child_process'
import { prompt } from 'inquirer'
import yargs from 'ts-yargs'
import * as fsx from 'fs-extra'
import * as config from '@tools/pkgcfg'
import * as places from '@tools/places'
import {
  createLogger,
  writeJSON,
  PackageManifest,
  TestManifest,
  ToolManifest,
  loadRootManifest
} from '@tools/utils'
const rootManifest = loadRootManifest()

const { editor, silent } = yargs
  .option('editor', {
    alias: 'e',
    describe: 'Open file after creation',
    type: 'string',
    default: ''
  })
  .option('silent', {
    alias: ['quiet', 'q'],
    describe: 'Whether to log actions to the terminal',
    type: 'boolean',
    default: false
  })
  .help()
  .argv

const log = createLogger(silent)

/**
 * Choose a scope from a list of scopes
 * @param choices Scopes to choose from
 */
export async function chooseScope (choices: ReadonlyArray<string | null>): Promise<string | null> {
  if (!choices.length) throw new Error('List of scopes is empty')

  if (choices.length === 1) {
    const [soleChoice] = choices
    return soleChoice
  }

  const answer = await prompt({
    name: 'scope',
    message: 'Which scope does the package belongs to',
    type: 'list',
    choices: choices.map(
      scope => scope === null
        ? { name: '<empty>', value: null }
        : { name: '@' + scope, value: scope }
    )
  })

  return answer.scope
}

interface Remaining {
  readonly description?: string
  readonly author: string
  readonly license: string
  readonly keywords?: string
  readonly sideEffects?: boolean | 'undefined'
}

async function promptRemaining (): Promise<Remaining> {
  return prompt([
    {
      name: 'description',
      message: 'Field "description" of package.json',
      type: 'input'
    },
    {
      name: 'author',
      message: 'Field "author" of package.json',
      type: 'input',
      default: rootManifest.author
    },
    {
      name: 'license',
      message: 'Field "license" of package.json',
      type: 'input',
      default: rootManifest.license || 'MIT' // empty string → 'MIT'
    },
    {
      name: 'keywords',
      message: 'Field "keywords" of package.json',
      type: 'input'
    },
    {
      name: 'sideEffects',
      message: 'Field "sideEffects" of package.json',
      type: 'list',
      choices: [
        { name: 'false', value: false },
        { name: 'true', value: true },
        { name: 'undefined', value: 'undefined' }
      ]
    }
  ])
}

async function openEditor (filename: string) {
  async function getOpener () {
    if (editor) return editor

    const { EDITOR } = process.env
    if (!EDITOR) return null

    const { confirmation } = await prompt({
      name: 'confirmation',
      message: `Execute ${EDITOR} ${filename}`,
      type: 'confirm'
    })

    return confirmation ? EDITOR : null
  }

  const opener = await getOpener()

  if (opener) {
    log(`Executing ${opener} ${filename}`)
    spawnSync(opener, [filename], { stdio: 'inherit' })
  }
}

/**
 * Write manifest file
 * @param container Place of the folder
 * @param name Name of the folder
 * @param manifest
 */
async function writeManifest (container: string, name: string, manifest: any) {
  const dirname = path.join(container, name)
  const filename = path.join(dirname, 'package.json')
  await fsx.mkdir(dirname)
  await writeJSON(filename, manifest)
  log(`Created file ${filename}`)
  await openEditor(filename)
}

/**
 * Create new package folder
 * @param name Folder name
 */
export async function newPackage (name: string) {
  const scope = await chooseScope(config.scopes)
  const { description, author, license, keywords, sideEffects } = await promptRemaining()
  const { homepage, repository, bugs, devDependencies } = rootManifest

  const manifest: PackageManifest = {
    name: scope ? `@${scope}/${name}` : name,
    version: '0.0.0',
    description: description || undefined, // empty string → undefined
    author,
    license,
    homepage,
    repository,
    bugs,
    keywords: keywords
      ? String(keywords).split(' ').filter(Boolean)
      : undefined,
    sideEffects: sideEffects === 'undefined' ? undefined : sideEffects,
    dependencies: {
      tslib: devDependencies.tslib,
      '@types/node': devDependencies['@types/node']
    }
  }

  await writeManifest(places.packages, name, manifest)
}

/**
 * Create new test folder
 * @param name Folder name
 */
export async function newTest (name: string) {
  async function getSubjectDeps () {
    const subjectPath = path.join(places.packages, name, 'package.json')
    if (!await fsx.pathExists(subjectPath)) return undefined

    const subjectName = JSON.parse(await fsx.readFile(subjectPath, 'utf8')).name

    const { confirmation } = await prompt({
      name: 'confirmation',
      message: `Add package ${JSON.stringify(subjectName)} to "dependencies"`,
      type: 'confirm',
      default: true
    })

    if (!confirmation) return undefined

    const dependency = 'file:' + path.relative(
      path.join(places.test, name),
      path.join(places.packages, name)
    )

    return {
      [subjectName]: dependency
    }
  }

  const manifest: TestManifest = {
    private: true,
    dependencies: await getSubjectDeps()
  }

  await writeManifest(places.test, name, manifest)
}

/**
 * Create new tool folder
 * @param name Folder name
 */
export async function newTool (name: string) {
  const manifest: ToolManifest = {
    name: '@tools/' + name,
    version: '0.0.0',
    private: true
  }

  await writeManifest(places.tools, name, manifest)
}

/**
 * Main program
 */
export async function main () {
  const { place, name } = await prompt([
    {
      name: 'place',
      message: 'Where to put the new folder',
      type: 'list',
      choices: [
        'packages',
        'test',
        'tools'
      ]
    },
    {
      name: 'name',
      message: 'Folder name',
      type: 'input',
      validate: input => Boolean(input)
    }
  ])

  switch (place) {
    case 'packages':
      return newPackage(name)
    case 'test':
      return newTest(name)
    case 'tools':
      return newTool(name)
    default:
      throw new Error(`Unexpected place: ${JSON.stringify(place)}`)
  }
}

export default main
