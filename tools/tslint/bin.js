#! /usr/bin/env node
const suffix = require('process').argv.slice(2)
const { spawnSync } = require('exec-inline')
const prefix = require('./index').argv
spawnSync('node', ...prefix, ...suffix).exit()
