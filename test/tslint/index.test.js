'use strict'
const cmd = require('@tools/test-spawn')
const { argv } = require('@tools/tslint')

it('TypeScript Linter', () => {
  cmd({
    defaultExecutable: 'node',
    argvPrefix: argv,
    envMiddleName: 'TSLINT',
  })
})
