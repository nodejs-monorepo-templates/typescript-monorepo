#! /usr/bin/env node
const { spawnSync } = require('child_process')
const process = require('process')
const prefix = require('./index').argv
const suffix = process.argv.slice(2)
const { status } = spawnSync('node', [...prefix, ...suffix], { stdio: 'inherit' })
process.exit(status)
