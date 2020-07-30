'use strict'
const path = require('path')

const {
  moduleFileExtensions,
  coveragePathIgnorePatterns,
} = require('./lib/constants')

const packageJson = {
  displayName: 'validate',
  testRegex: 'package\\.json$',
  runner: require.resolve('./runners/package-json'),
}

const test = {
  displayName: 'test',
  transform: {
    '\\.jsx?$': require.resolve('babel-jest'),
    '\\.tsx?$': require.resolve('ts-jest'),
    '\\.(yaml|yml)$': require.resolve('yaml-jest'),
  },
  testRegex: '\\.(test|spec|check)\\.(jsx?|tsx?)$',
  moduleFileExtensions,
  coveragePathIgnorePatterns,
  globals: {
    'ts-jest': {
      diagnostics: false,
      isolatedModules: true,
      preserveConstEnums: true,
      tsConfig: path.resolve(__dirname, 'tsconfig.test.json'),
    },
  },
}

const projects = [
  packageJson,
  test,
]

module.exports = { projects }
