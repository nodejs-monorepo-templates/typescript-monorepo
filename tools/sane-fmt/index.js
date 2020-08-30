'use strict'
const path = require('path')
const fs = require('fs')
const { spawnSync } = require('child_process')
const process = require('process')
const exec = require('exec-inline').spawnSync
const command = require.resolve('@sane-fmt/wasm32-wasi/bin')
const { project } = require('@tools/places')

const argvPrefix = process.argv.slice(2)
const TARGET_REGEX = /\.(js|ts)x?$/i

function execCmd(command, args, options) {
  const { error, status, stdout } = spawnSync(command, args, {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'inherit'],
    ...options,
  })

  if (error) throw error
  if (status) throw new Error(`Failed to execute ${command} ${args.join(' ')}`)

  return stdout
}

async function listTargets() {
  const fromLS = execCmd('git', ['ls-files'], { cwd: project })
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .filter(filename => TARGET_REGEX.test(filename))

  const fromStatus = execCmd('git', ['status', '--porcelain=v1'], { cwd: project })
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => line.slice(3))
    .filter(filename => TARGET_REGEX.test(filename))

  return [...new Set([...fromLS, ...fromStatus])]
    .filter(filename => fs.existsSync(path.resolve(project, filename)))
}

async function createArgv() {
  const targets = await listTargets()
  return [...argvPrefix, '--', ...targets]
}

async function execute() {
  const argv = await createArgv()
  return exec(process.execPath, command, ...argv).exit()
}

module.exports = {
  command,
  listTargets,
  createArgv,
  execute,
}
