'use strict'
const path = require('path')
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
  path.resolve(places.tools, 'test-spawn')
]

module.exports = {
  moduleFileExtensions,
  coveragePathIgnorePatterns
}
