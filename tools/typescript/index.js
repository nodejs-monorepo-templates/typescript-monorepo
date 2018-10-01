'use strict'
const path = require('path')
const places = require('@tools/places')

module.exports = {
  bin: require.resolve('typescript/bin/tsc'),
  config: path.join(places.project, 'tsconfig.json')
}
