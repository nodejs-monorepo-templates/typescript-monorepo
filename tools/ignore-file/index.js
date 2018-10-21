require('@tools/preloaded-node/register')

Object.assign(exports, {
  bin: {
    write: require.resolve('./bin/write')
  },
  ...require('./lib')
})

Object.defineProperty(exports, '__esModule', { value: true })
