#! /usr/bin/env node
const { argv } = require('process')
const { spawnSync } = require('exec-inline')
const projdir = require('@tools/places').project
const command = require.resolve('clean-typescript-build/bin/clean-typescript-build')
spawnSync('node', command, projdir, ...argv.slice(2)).exit()
