'use strict'
const path = require('path')
const chalk = require('chalk').default
const places = require('@tools/places')
const prefix = chalk.dim('$')
const node = chalk.dim('node')
const projectPrfx = '<project>'
const program = chalk.bold

module.exports = (first, second, ...rest) => {
  const formatedRest = rest.map(x => x.replace(places.project, projectPrfx))

  if (first === 'node') {
    const [left, right] = second.split(places.project + '/')

    if (!right) {
      return [prefix, node, program(left), ...rest]
    }

    const [branch, pkg, ...pathRest] = right.split(path.sep)

    const script =
      ['packages', 'tools', 'test'].includes(branch)
        ? chalk.dim(`<${branch}>` + path.sep) + program(pkg + path.sep) + pathRest.join(path.sep)
        : chalk.dim(projectPrfx + path.sep) + program([pkg, ...pathRest].join(path.sep))

    return [prefix, node, script, ...rest]
  }

  return [
    prefix,
    program(first),
    second,
    ...formatedRest
  ]
}
