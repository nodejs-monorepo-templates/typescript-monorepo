'use strict'
const places = require('@tools/places')

const moduleFileExtensions = [
  'ts',
  'tsx',
  'js',
  'jsx',
  'json',
  'node'
]

const coveragePathIgnorePatterns = [
  places.test,
  places.tools
]

module.exports = {
  moduleFileExtensions,
  coveragePathIgnorePatterns
}
