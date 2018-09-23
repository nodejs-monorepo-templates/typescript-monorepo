'use strict'
const cmd = require('@tools/test-spawn')
const { bin } = require('@tools/standardjs')

it('JavaScript Coding Style: Standard', () => {
  cmd({
    defaultExecutable: 'node',
    argvPrefix: [bin],
    envMiddleName: 'STANDARDJS'
  })
})
