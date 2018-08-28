#! /usr/bin/env node
const path = require('path')
const {argv, env, exit} = require('process')
const {spawnSync} = require('child_process')
const receivedArgv = argv.slice(2)
const register = require.resolve('./register')
const preloadedArgv = ['--require', register]
const finalArgv = [...preloadedArgv, ...receivedArgv]
const {PATH = '', NODE_PATH = ''} = env

const addPath = (pathVar, ...addend) =>
  pathVar.trim().split(path.delimiter).concat(...addend).join(path.delimiter)

const {status} = spawnSync(
  'node',
  finalArgv,
  {
    stdio: 'inherit',
    env: {
      ...env,
      PATH: addPath(PATH, path.resolve(__dirname, 'node_modules/.bin')),
      NODE_PATH: addPath(NODE_PATH, path.resolve(__dirname, 'node_modules'))
    }
  }
)

exit(status)
