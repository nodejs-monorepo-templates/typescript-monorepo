'use strict'
const path = require('path')
const fs = require('fs')
const yaml = require('js-yaml')
const places = require('@tools/places')
const basename = '.pkgcfg.yaml'
const filename = path.resolve(places.project, basename)
const text = fs.readFileSync(filename, { encoding: 'utf8' })
const pkgcfg = yaml.safeLoad(text)
Object.defineProperty(exports, '__esModule', { value: true })
Object.assign(exports, pkgcfg)
