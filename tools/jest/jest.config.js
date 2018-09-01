'use strict'

const {
  moduleFileExtensions,
  coveragePathIgnorePatterns
} = require('./lib/contants')

module.exports = {
  transform: {
    '\\.jsx?$': require.resolve('babel-jest'),
    '\\.tsx?$': require.resolve('ts-jest'),
    '\\.(yaml|yml)$': require.resolve('yaml-jest')
  },
  testRegex: '(test|spec|check)\\.(jsx?|tsx?)$',
  moduleFileExtensions,
  coveragePathIgnorePatterns
}
