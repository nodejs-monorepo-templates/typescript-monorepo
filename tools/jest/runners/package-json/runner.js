const path = require('path')
const fs = require('fs')
const deepEqual = require('fast-deep-equal')
const semver = require('semver')
const runner = require('create-jest-runner')
const depRange = require('parse-dependency-range')
const { unwrap } = require('convenient-typescript-utilities').func
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
  const pushif = (fn, msg) => unwrap(fn) && reasons.push(unwrap(msg))
  const rule = (fn, msg) => () => pushif(fn, msg)
  const mustHaveName = rule(() => !manifest.name, 'Missing field "name"')
  const mustNotHaveName = rule(() => 'name' in manifest, 'Field "name" is not necessary')
  const mustHaveVersion = rule(() => !manifest.version, 'Missing field "version"')
  const mustNotHaveVersion = rule(() => 'version' in manifest, 'Field "version" is not necessary')
  const mustBePrivate = rule(() => !manifest.private, 'Must have field "private" set to true')
  const mustBePublic = rule(() => 'private' in manifest, 'Must not have field "private"')

  const createLocalDependencyTreater = field => {
    switch (field) {
      case 'dependencies':
        return name =>
          reasons.push(`Local dependency should not be listed in "dependencies": ${name}`)
      case 'devDependencies':
        return () => () => {}
    }

    throw new RangeError(`Invalid field: ${JSON.stringify(field)}`)
  }

  const checkDependency = field => {
    const dependencies = manifest[field]
    if (!dependencies) return

    const treatLocalDependency = createLocalDependencyTreater(field)

    for (const [name, range] of Object.entries(dependencies)) {
      const depManifestPath = path.resolve(container, 'node_modules', name, 'package.json')

      if (!fs.existsSync(depManifestPath)) {
        reasons.push(`Dependency ${name} (${field}) is not installed`)
        continue
      }

      const { name: actualName, version } = require(depManifestPath)
      const parsedVersion = depRange.parse(range)

      switch (parsedVersion.type) {
        case depRange.Type.Semver: {
          const condition =
            actualName !== name || !semver.satisfies(version, range)

          const message = () =>
            `Expected ${name}@${range} (${field}) but received ${actualName}@${version} (node_modules)`

          pushif(condition, message)
          break
        }

        case depRange.Type.Local: {
          treatLocalDependency(name)

          {
            const expected = path.resolve(parsedVersion.path)
            const received = container
            const condition = expected !== received

            const message = () =>
              `Expected ${name} ("${range}") to be at "${expected}" but received "${received}" instead`

            pushif(condition, message)
          }

          {
            const expected = depRange.LocalUrl.Protocol.File
            const received = parsedVersion.protocol
            const condition = expected !== received

            const message = () =>
              `Expected "${expected}" as protocol but received "${received}" instead`

            pushif(condition, message)
          }

          break
        }

        case depRange.Type.Git: {
          const condition =
            parsedVersion.url.protocol === depRange.GitUrl.Protocol.Local

          const message =
            'Do not use "git+file:" protocol to link local package, use "file:" instead'

          pushif(condition, message)
          break
        }

        case depRange.Type.Latest: {
          reasons.push('Do not use "latest"')
          break
        }

        case depRange.Type.Unknown: {
          reasons.push(`SyntaxError: Unrecognizable syntax: ${JSON.stringify(range)}`)
          break
        }
      }
    }
  }

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

  checkDependency('dependencies')
  checkDependency('devDependencies')

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
