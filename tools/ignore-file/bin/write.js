#! /usr/bin/env node
const path = require('path')
const process = require('process')
const places = require('@tools/places')
const { writeIgnoreFiles } = require('../index')
const basename = '.npmignore'
const basefile = path.resolve(places.packages, basename)

writeIgnoreFiles(basefile, basename, '**', places.packages).catch(error => {
  console.error(`[ERROR] An error occurred while writing .npmignore files`)
  console.error(error)
  process.exit(1)
})
