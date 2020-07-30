'use strict'
const cmd = require('@tools/test-spawn')
const { command, listTargets } = require('@tools/sane-fmt')

it('Code Style: sane-fmt', async () => {
  const argvPrefix = [
    command,
    '--hide-passed',
  ]

  const argvSuffix = [
    '--',
    ...await listTargets(),
  ]

  cmd({
    argvPrefix,
    argvSuffix,
    defaultExecutable: require('process').execPath,
    envMiddleName: 'SANE_FMT',
  })
})
