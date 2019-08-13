const esm = require('../esm')

/**
 * @callback LogFunc
 * @param {...*} args Values to log out
 * @returns {void}
 */

/**
 * Create a logger function
 * @param {'silent' | 'stdout' | 'stderr'} target Where to log to
 * @returns {LogFunc}
 */
function createLogger (target) {
  switch (target) {
    case 'silent':
      return () => undefined
    case 'stdout':
      return console.info
    case 'stderr':
      return console.error
  }
}

Object.defineProperty(createLogger, '__esModule', { value: true })

module.exports = Object.assign(esm(createLogger), {
  createLogger
})
