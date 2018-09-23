'use strict'
const bin = require.resolve('tslint/bin/tslint')
const config = require.resolve('./tslint.json')
const { project } = require('@tools/places')
const argv = [bin, '--config', config, '--project', project]

module.exports = {
  bin,
  config,
  project,
  argv
}
