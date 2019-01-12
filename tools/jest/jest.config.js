'use strict'
const {
  TEST_WITHOUT_COVERAGE = 'false'
} = require('process').env

const collectCoverage = TEST_WITHOUT_COVERAGE.toLowerCase() !== 'true'

const {
  moduleFileExtensions,
  coveragePathIgnorePatterns
} = require('./lib/constants')

const packageJson = {
  displayName: 'validate',
  testRegex: 'package\\.json$',
  runner: require.resolve('./runners/package-json')
}

const test = {
  displayName: 'test',
  transform: {
    '\\.jsx?$': require.resolve('babel-jest'),
    '\\.tsx?$': require.resolve('ts-jest'),
    '\\.(yaml|yml)$': require.resolve('yaml-jest')
  },
  testRegex: '\\.(test|spec|check)\\.(jsx?|tsx?)$',
  moduleFileExtensions,
  collectCoverage,
  coveragePathIgnorePatterns,
  globals: {
    'ts-jest': {
      diagnostics: false
    }
  }
}

const projects = [
  packageJson,
  test
]

module.exports = { projects }
