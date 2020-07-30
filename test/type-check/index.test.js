'use strict'
const cmd = require('@tools/test-spawn')

it('TypeScript: Type Check', () => {
  cmd({
    defaultExecutable: 'node',
    argvPrefix: [
      require.resolve('typescript/bin/tsc'),
      '--noEmit',
    ],
    envMiddleName: 'TSC',
  })
})
