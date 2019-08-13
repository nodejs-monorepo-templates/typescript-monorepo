require('@tools/preloaded-node/register')
const esm = require('./esm')
const logger = require('./logger')

module.exports = esm({ esm, logger })
