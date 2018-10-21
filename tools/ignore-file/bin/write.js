#! /usr/bin/env node
const path = require('path')
const process = require('process')
const places = require('@tools/places')
const { writeIgnoreFiles } = require('../index')
const basename = '.npmignore'
const basefile = path.resolve(places.packages, basename)
const pattern = path.join(places.packages, '*')

writeIgnoreFiles(basefile, basename, pattern, places.packages).catch(error => {
  console.error(`[ERROR] An error occurred while writing .npmignore files`)
  console.error(error)
  process.exit(1)
})
