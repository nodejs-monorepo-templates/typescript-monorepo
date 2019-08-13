/**
 * An object turned ES module
 * @template Target
 * @typedef {Target & { default: ESM.<Target> }} ESM
 */

/**
 * Turn `object` into an ES module
 * @template Target
 * @param {Target} object Object
 * @param {boolean=} value Value of "__esModule" property
 * @returns {ESM.<Target>}
 */
function setEsModule (object, value = true) {
  Object.defineProperty(object, '__esModule', { value })
  return Object.assign(object, { default: object })
}

setEsModule(setEsModule)
module.exports = Object.assign(setEsModule, { setEsModule })
