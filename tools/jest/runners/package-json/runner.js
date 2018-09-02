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

  const manifest = require(resolvedPath)
  const rule = (fn, msg) => () => fn(manifest) && reasons.push(msg)
  const mustHaveName = rule(() => !manifest.name)
  const mustNotHaveName = rule(() => 'name' in manifest)
  const mustBePrivate = rule(() => !manifest.private)
  const mustBePublic = rule(() => 'private' in manifest) // not even "private": false is allowed

  if (!manifest.version) {
    reasons.push('Missing field "version"')
  }

  if (resolvedPath === globalManifestPath) {
    mustBePrivate()

    for (const key of matchingKeys) {
      reasons.push(`Missing field "${key}"`)
    }

    return getResult()
  }

  if (resolvedPath.startsWith(places.packages)) {
    mustHaveName()

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

    return getResult()
  }

  if (resolvedPath.startsWith(places.test)) {
    mustNotHaveName()
    mustBePrivate()
    return getResult()
  }
}

module.exports = main
