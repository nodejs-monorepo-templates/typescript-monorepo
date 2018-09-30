#! /usr/bin/env node
const { spawnSync } = require('exec-inline')
const places = require('@tools/places')
const command = require('../index').commands.nestedWorkspaceHelpder

spawnSync(
  command,
  'verman',
  'mismatches',
  places.project,
  ...process.argv.slice(2)
).exit()
