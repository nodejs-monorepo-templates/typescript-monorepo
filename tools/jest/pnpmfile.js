function readPackage (pkg, ctx) {
  if (pkg.name === 'ts-jest') {
    const version = require('./package.json').dependencies.jest
    pkg.dependencies['jest-config'] = version
    ctx.log('added jest-config to dependencies of ts-jest')
  }

  return pkg
}

module.exports = {
  hooks: {
    readPackage
  }
}
