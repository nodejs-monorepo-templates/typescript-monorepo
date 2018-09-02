const path = require('path')
const deepEqual = require('fast-deep-equal')
const runner = require('create-jest-runner')
const places = require('places.tool')
const globalManifestPath = path.resolve(places.project, 'package.json')
const globalManifest = require(globalManifestPath)

function main ({ testPath }) {
  const start = Date.now()
  const reasons = []
  const resolvedPath = path.resolve(testPath)
  const container = path.dirname(resolvedPath)
  const containerBaseName = path.basename(container)
  const manifest = require(resolvedPath)
  const matchingKeys = ['license', 'author', 'homepage', 'repository', 'bugs']

  const getResult = () => reasons.length
    ? runner.fail({
      start,
      end: Date.now(),
      test: {
        path: testPath,
        errorMessage: reasons.map(x => '    ' + x).join('\n')
      }
    })
    : runner.pass({
      start,
      end: Date.now(),
      test: {
        path: testPath
      }
    })

  const rule = (fn, msg) => () => fn(manifest) && reasons.push(msg)
  const mustHaveName = rule(() => !manifest.name, 'Missing field "name"')
  const mustNotHaveName = rule(() => 'name' in manifest, 'Field "name" is not necessary')
  const mustHaveVersion = rule(() => !manifest.version, 'Missing field "version"')
  const mustNotHaveVersion = rule(() => 'version' in manifest, 'Field "version" is not necessary')
  const mustBePrivate = rule(() => !manifest.private, 'Must have field "private" set to true')
  const mustBePublic = rule(() => 'private' in manifest, 'Must not have field "private"')

  if (resolvedPath === globalManifestPath) {
    mustBePrivate()
    mustNotHaveVersion()

    for (const key of matchingKeys) {
      if (key in manifest) continue
      reasons.push(`Missing field "${key}"`)
    }

    if ('dependencies' in manifest) {
      reasons.push('Use "devDependencies" instead')
    }

    return getResult()
  }

  if ('devDependencies' in manifest) {
    reasons.push('Only global manifest is allowed to have "devDependencies"')
  }

  if (resolvedPath.startsWith(places.packages)) {
    mustHaveName()
    mustHaveVersion()

    if (manifest.name !== containerBaseName) {
      reasons.push(
        `Expected package's name to be "${containerBaseName}" but received "${manifest.name}" instead`
      )
    }

    mustBePublic()

    for (const key of matchingKeys) {
      if (!manifest[key]) {
        reasons.push(`Missing field "${key}"`)
        continue
      }

      if (!deepEqual(manifest[key], globalManifest[key])) {
        reasons.push(`Field "${key}" does not match its global conterpart`)
      }
    }

    const requiredDependencies = ['@types/node', 'tslib']

    if ('dependencies' in manifest) {
      for (const name of requiredDependencies) {
        if (name in manifest.dependencies) continue
        reasons.push(`Missing dependency "${name}"`)
      }
    } else {
      reasons.push(
        ...requiredDependencies.map(name => `Missing dependency "${name}"`)
      )
    }

    return getResult()
  }

  if (resolvedPath.startsWith(places.tools)) {
    mustHaveName()

    const expectedName = containerBaseName + '.tool'
    if (manifest.name !== expectedName) {
      reasons.push(
        `Expected package's name to be "${expectedName}" but received "${manifest.name}" instead`
      )
    }

    mustBePrivate()
    mustHaveVersion()

    for (const key of matchingKeys) {
      if (key in manifest) {
        reasons.push(`Field "${key}" is not necessary`)
      }
    }

    return getResult()
  }

  if (resolvedPath.startsWith(places.test)) {
    mustNotHaveName()
    mustBePrivate()
    mustNotHaveVersion()
    return getResult()
  }
}

module.exports = main
