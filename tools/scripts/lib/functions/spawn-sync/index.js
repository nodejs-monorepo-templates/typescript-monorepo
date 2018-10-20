'use strict'
const { SHOW_SPAWN_CMD = 'false' } = require('process').env
const { spawnSync } = require('exec-inline')
const formatCommand = require('../format-command')

module.exports = SHOW_SPAWN_CMD.toLowerCase() === 'true'
  ? (...args) => {
    console.info(...formatCommand(...args))
    return spawnSync(...args)
  }
  : spawnSync
