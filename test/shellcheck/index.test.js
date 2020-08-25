'use strict'
const fs = require('fs-extra')
const path = require('path')
const { lookpath } = require('lookpath')
const cmd = require('@tools/test-spawn')
const places = require('@tools/places')

const listShellFiles = async () =>
  (await fs.readdir(path.join(places.project, 'ci')))
    .filter(name => name.endsWith('.sh') || name.endsWith('.bash'))
    .map(name => path.join('ci', name))

it('ShellCheck', async () => {
  const shellcheck = await lookpath('shellcheck')

  if (!shellcheck) {
    console.info('Program "shellcheck" does not exist. Skipping.')
    return
  }

  const shellFiles = await listShellFiles()

  if (shellFiles.length) {
    cmd({
      defaultExecutable: shellcheck,
      argvSuffix: shellFiles,
    })
  }
})
