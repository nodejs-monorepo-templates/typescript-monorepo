'use strict'
const path = require('path')
const xjest = require('extra-jest')
const {spawn, spawnSync} = require('../index')
const script = path.resolve(__dirname, 'data/main.js')

beforeEach(() => {
  jest.setTimeout(131072)
})

afterEach(() => {
  jest.setTimeout(5000)
})

it('spawn function works', () => {
  let stdout = ''
  let stderr = ''
  const child = spawn([script], {encoding: 'utf8'})

  child.stdout.on('data', chunk => { stdout += chunk })
  child.stderr.on('data', chunk => { stderr += chunk })

  return new Promise((resolve, reject) => {
    child.on('exit', status => resolve(status))
    child.on('error', error => reject(error))
  }).then(
    status => xjest.snap.unsafe({stdout, stderr, status})()
  )
})

it('spawnSync function works', () => {
  const {status, error, signal, stdout, stderr} = spawnSync([script], {encoding: 'utf8'})
  xjest.snap.unsafe({status, error, signal, stdout, stderr})()
})
