'use strict'
const cmd = require('test-spawn.private')

it('TypeScript: Type Check', () => {
  cmd({
    defaultExecutable: 'tsc',
    argvPrefix: ['--noEmit'],
    envMiddleName: 'STANDARDJS'
  })
})
