'use strict'
const files = require('@tools/files')
const places = require('@tools/places')

const moduleFileExtensions = [
  'ts',
  'tsx',
  'js',
  'jsx',
  'json',
  'node'
]

const collectCoverageFrom = files.PACKAGED_TYPESCRIPT

const coveragePathIgnorePatterns = [
  places.test,
  places.tools
]

module.exports = {
  moduleFileExtensions,
  collectCoverageFrom,
  coveragePathIgnorePatterns
}
