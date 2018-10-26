'use strict'
const { spawnSync } = require('child_process')
const places = require('@tools/places')

const { stdout, stderr, status, signal } = spawnSync(
  'git',
  ['ls-files'],
  {
    encoding: 'utf8',
    cwd: places.project
  }
)

if (status) {
  throw new Error(
    `git ls-files unexpectedly terminated.(status: ${status}, signal: ${signal}).\n${stderr}`
  )
}

module.exports = stdout.split(/\r|\n/).filter(Boolean)
