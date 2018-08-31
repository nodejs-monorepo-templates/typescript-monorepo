'use strict'
const {resolve} = require('path')
const project = resolve(__dirname, '../..')
const test = resolve(project, 'test')
const tools = resolve(project, 'tools')
Object.defineProperty(exports, '__esModule', {value: true})
Object.assign(exports, {project, test, tools})
