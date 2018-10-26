'use strict'
module.exports = require('../git-ls-files').filter(name => /\.ts$/.test(name))
