'use strict'
const places = require('places.tool')

const standardjs = {
  displayName: 'standardjs',
  runner: require.resolve('jest-runner-standard'),
  testMatch: ['<rootDir>/**/*.js'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/'
  ]
}

const test = {
  displayName: 'test',
  transform: {
    '\\.jsx?$': require.resolve('babel-jest'),
    '\\.tsx?$': require.resolve('ts-jest'),
    '\\.(yaml|yml)$': require.resolve('yaml-jest')
  },
  testRegex: '(test|spec|check)\\.(jsx?|tsx?)$',
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
    'jsx',
    'json',
    'node'
  ],
  coveragePathIgnorePatterns: [
    places.test
  ]
}

module.exports = {
  projects: [
    standardjs,
    test
  ]
}
