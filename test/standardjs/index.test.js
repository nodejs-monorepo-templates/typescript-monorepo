'use strict'
const cmd = require('test-spawn.tool')

it('JavaScript Coding Style: Standard', () => {
  cmd({
    defaultExecutable: 'node',
    argvPrefix: [
      require.resolve('standard/bin/cmd')
    ],
    envMiddleName: 'STANDARDJS'
  })
})
