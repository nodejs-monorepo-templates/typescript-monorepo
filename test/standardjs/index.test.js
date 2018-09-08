'use strict'
const cmd = require('@tools/test-spawn')

it('JavaScript Coding Style: Standard', () => {
  cmd({
    defaultExecutable: 'node',
    argvPrefix: [
      require.resolve('standard/bin/cmd')
    ],
    envMiddleName: 'STANDARDJS'
  })
})
