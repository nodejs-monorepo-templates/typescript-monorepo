'use strict'
const path = require('path')
const fs = require('fs')
const yaml = require('js-yaml')
const filename = path.resolve(__dirname, 'jest.config.yaml')
const filecontent = fs.readFileSync(filename, 'utf8')
const config = yaml.safeLoad(filecontent)
module.exports = config
