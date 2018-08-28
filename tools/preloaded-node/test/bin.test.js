'use strict'
const path = require('path')
const {spawnSync} = require('child_process')
const xjest = require('extra-jest')
const {bin} = require('../index')
const script = path.resolve(__dirname, 'data/main.js')

const {
  status,
  signal,
  error,
  stdout,
  stderr
} = spawnSync(
  'node',
  [bin, script],
  {
    encoding: 'utf8'
  }
)

const testfunc = xjest.snap.unsafe({
  status,
  signal,
  error: error ? String(error) : null,
  stdout: stdout || '(Empty)',
  stderr: stderr || '(Empty)'
})

it('matches snapshot', testfunc)
