'use strict'
const { join } = require('path')
const project = join(__dirname, '../..')
const packages = join(project, 'packages')
const test = join(project, 'test')
const tools = join(project, 'tools')
Object.defineProperty(exports, '__esModule', { value: true })
Object.assign(exports, { project, packages, test, tools })
