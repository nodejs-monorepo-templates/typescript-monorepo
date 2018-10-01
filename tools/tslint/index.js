'use strict'
const path = require('path')
const bin = require.resolve('tslint/bin/tslint')
const { project } = require('@tools/places')
const config = path.join(project, 'tslint.json')
const argv = [bin, '--project', project]

module.exports = {
  bin,
  config,
  project,
  argv
}
