'use strict'
const cmd = require('test-spawn.tool')

it('TypeScript: Type Check', () => {
  cmd({
    defaultExecutable: 'tsc',
    argvPrefix: ['--noEmit'],
    envMiddleName: 'STANDARDJS'
  })
})
