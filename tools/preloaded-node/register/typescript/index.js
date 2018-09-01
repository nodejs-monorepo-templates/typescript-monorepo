require('../json5')

const { compilerOptions } = require('tsconfig.tool')

require('ts-node').register({
  typeCheck: true,
  compilerOptions: {
    ...compilerOptions,
    noUnusedLocals: false,
    noUnusedParameters: false
  }
})
