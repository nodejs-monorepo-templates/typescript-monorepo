require('../json5')

const { config } = require('@tools/typescript')
const { compilerOptions } = require(config)

require('ts-node').register({
  typeCheck: true,
  compilerOptions: {
    ...compilerOptions,
    noUnusedLocals: false,
    noUnusedParameters: false
  }
})
