const path = require('path')
const { spawnSync } = require('child_process')
const process = require('process')
const { prompt } = require('inquirer')
const fsx = require('fs-extra')
const config = require('@tools/pkgcfg')
const places = require('@tools/places')
const rootManifest = require(path.resolve(places.project, 'package.json'))

const { editor } = require('ts-yargs')
  .option('editor', {
    alias: 'e',
    describe: 'Open file after creation',
    type: 'string',
    default: ''
  })
  .help()
  .argv

/**
 * Choose a scope from a list of scopes
 * @param {Array.<string | null>} choices Scopes to choose from
 * @returns {Promise.<string | null>}
 */
async function chooseScope (choices) {
  if (!choices.length) throw new Error('List of scopes is empty')

  if (choices.length === 1) {
    const [soleChoice] = choices
    return soleChoice == null
      ? { tag: false }
      : { tag: true, value: soleChoice }
  }

  const answer = await prompt({
    name: 'scope',
    message: 'Which scope does the package belongs to',
    type: 'list',
    choices: choices.map(
      scope => scope == null
        ? { name: '<empty>', value: null }
        : { name: '@' + scope, value: scope }
    )
  })

  return answer.scope
}

/**
 * Ask remaining question
 * @returns {Promise.<{ name: string, author: string, license: string }>}
 */
async function promptRemaining () {
  return prompt([
    {
      name: 'author',
      message: 'Field "author" of package.json',
      type: 'input',
      default: String(rootManifest.author)
    },
    {
      name: 'license',
      message: 'Field "license" of package.json',
      type: 'input',
      default: rootManifest.license || 'MIT'
    }
  ])
}

/**
 * Ask to open an editor
 * @param {string} filename File to open
 * @returns {Promise.<void>}
 */
async function openEditor (filename) {
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
    console.info(`Executing ${opener} ${filename}`)
    spawnSync(opener, [filename], { stdio: 'inherit' })
  }
}

/**
 * Write manifest file
 * @param {string} container Place of the folder
 * @param {string} name Name of the folder
 * @param {any} manifest
 * @returns {Promise.<void>}
 */
async function writeManifest (container, name, manifest) {
  const dirname = path.join(container, name)
  const filename = path.join(dirname, 'package.json')
  const content = JSON.stringify(manifest, undefined, 2) + '\n'
  await fsx.mkdir(dirname)
  await fsx.writeFile(filename, content)
  console.info(`Created file ${filename}`)
  await openEditor(filename)
}

/**
 * Create new package folder
 * @param {string} name Folder name
 */
async function newPackage (name) {
  const scope = await chooseScope(config.scopes)
  const { author, license } = await promptRemaining()
  const { homepage, repository, bugs, devDependencies } = rootManifest

  const manifest = {
    name: scope ? `@${scope}/${name}` : name,
    version: '0.0.0',
    author,
    license,
    homepage,
    repository,
    bugs,
    dependencies: {
      tslib: devDependencies.tslib,
      '@types/node': devDependencies['@types/node']
    }
  }

  await writeManifest(places.packages, name, manifest)
}

/**
 * Create new test folder
 * @param {string} name Folder name
 */
async function newTest (name) {
  async function getSubjectDeps () {
    const subjectPath = path.join(places.packages, name, 'package.json')
    if (!fsx.existsSync(subjectPath)) return {}

    const subjectName = JSON.parse(await fsx.readFile(subjectPath)).name

    const { confirmation } = await prompt({
      name: 'confirmation',
      message: `Add package ${JSON.stringify(subjectName)} to "dependencies"`,
      type: 'confirm',
      default: true
    })

    if (!confirmation) return {}

    const dependency = 'file:' + path.relative(
      path.join(places.test, name),
      path.join(places.packages, name)
    )

    return {
      dependencies: {
        [subjectName]: dependency
      }
    }
  }

  const manifest = {
    private: true,
    ...await getSubjectDeps()
  }

  await writeManifest(places.test, name, manifest)
}

/**
 * Create new tool folder
 * @param {string} name Folder name
 */
async function newTool (name) {
  const manifest = {
    name: '@tools/' + name,
    version: '0.0.0',
    private: true
  }

  await writeManifest(places.tools, name, manifest)
}

/**
 * Main program
 */
async function main () {
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
      type: 'input'
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

Object.defineProperty(main, '__esModule', { value: true })

module.exports = Object.assign(main, {
  chooseScope,
  newPackage,
  newTest,
  newTool,
  main,
  default: main
})
