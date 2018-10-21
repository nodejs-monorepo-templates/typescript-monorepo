#! /usr/bin/env node
const process = require('process')
const chalk = require('chalk').default
const git = require('git-ts')
const wrkspc = require('nested-workspace-helper')
const places = require('@tools/places')
const cmdPrfx = chalk.dim('$ git tag')
const repo = new git.Repository(places.project)
const { tags } = repo

const { argv } = require('yargs')
  .usage('$0 [options]')
  .option('dry', {
    alias: 'u',
    describe: 'Examine tags going to be added without actually adding them',
    type: 'boolean',
    default: false
  })
  .help()

const addTag = argv.dry
  ? () => {}
  : tagName => tags.addTag(tagName)

async function main () {
  const allTags = tags.getAllTags()
  const packages = await wrkspc.listAllPackages(places.packages)

  for (const item of packages) {
    const { name, version } = item.manifestContent
    const tagName = `${name}/${version}`
    if (allTags.includes(tagName)) continue
    console.info(`${cmdPrfx} ${chalk.bold(tagName)}`)
    addTag(tagName)
  }

  return 0
}

main().then(
  status => process.exit(status),
  error => {
    console.error(error)
    process.exit(-1)
  }
)
