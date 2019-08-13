const esm = require('../esm')

/**
 * @callback LogFunc
 * @param {...*} args Values to log out
 * @returns {void}
 */

/**
 * Create a logger function
 * @param {boolean} silent Where to log to
 * @param {LogFunc=} log Log function
 * @returns {LogFunc}
 */
function createLogger (silent, log = console.info) {
  return silent ? () => undefined : log
}

Object.defineProperty(createLogger, '__esModule', { value: true })

module.exports = Object.assign(esm(createLogger), {
  createLogger
})
