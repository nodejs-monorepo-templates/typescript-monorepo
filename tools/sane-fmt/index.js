'use strict'
const path = require('path')
const fs = require('fs')
const process = require('process')
const git = require('isomorphic-git')
const { spawnSync } = require('exec-inline')
const command = require.resolve('@sane-fmt/wasm32-wasi/bin')
const { project } = require('@tools/places')

const argvPrefix = process.argv.slice(2)
const TARGET_REGEX = /\.(js|ts)x?$/i

async function listTargets() {
  const fromLS = (await git.listFiles({ fs, dir: project }))
    .filter(filename => TARGET_REGEX.test(filename))

  const fromStatus = (
    await git.statusMatrix({
      fs,
      dir: project,
      filter: filename => TARGET_REGEX.test(filename),
    })
  ).map(([filename]) => filename)

  return [...new Set([...fromLS, ...fromStatus])]
    .filter(filename => fs.existsSync(path.resolve(project, filename)))
}

async function createArgv() {
  const targets = await listTargets()
  return [...argvPrefix, '--', ...targets]
}

async function execute() {
  const argv = await createArgv()
  return spawnSync(process.execPath, command, ...argv).exit()
}

module.exports = {
  command,
  listTargets,
  createArgv,
  execute,
}
