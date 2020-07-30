const path = require('path')
const fs = require('fs')
const deepEqual = require('fast-deep-equal')
const semver = require('semver')
const runner = require('create-jest-runner')
const depRange = require('parse-dependency-range')
const { unwrap } = require('convenient-typescript-utilities').func
const justTry = require('just-try')
const pkgcfg = require('@tools/pkgcfg')
const places = require('@tools/places')
const globalManifestPath = path.resolve(places.project, 'package.json')
const globalManifest = require(globalManifestPath)

function main({ testPath }) {
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

  const checkName = (dirname, pkgname) => {
    const matches = /^@([a-z0-9.-]+)\/([a-z0-9.-]+)$/i.exec(pkgname)

    if (matches) {
      const [scope, branch] = matches.slice(1)

      if (!pkgcfg.scopes.includes(scope)) {
        reasons.push(`This monorepo does not allow "@${scope}/" scoped packages`)
      }

      if (dirname !== branch) {
        const expected = `@${scope}/${dirname}`
        reasons.push(`Expecting package's name to be "${expected}" but received "${pkgname}" instead`)
      }
    } else {
      if (!pkgcfg.scopes.some(x => !x)) {
        reasons.push('This monorepo does not allow non-scoped packages')
      } else if (dirname !== pkgname) {
        reasons.push(`Expecting package's name to be "${dirname}" but received "${pkgname}" instead`)
      }
    }
  }

  const getDependencyPath = (name, ...args) => path.resolve(container, 'node_modules', name, ...args)

  const isPrivateDependency = name => {
    const dependencyManifestPath = getDependencyPath(name, 'package.json')
    const dependencyManifest = require(dependencyManifestPath)
    return dependencyManifest.private
  }

  const createDependencyTreater = privateDependant =>
    privateDependant
      ? {
        local() {},
        semver: {
          ifLocal(name) {
            const shortpath = getDependencyPath(name)
            const realpath = fs.realpathSync(shortpath)
            const dirname = path.dirname(realpath)
            if ([places.packages, places.tools].includes(dirname)) {
              reasons.push(`Expecting local package to use 'file:' but received semver: ${name}`)
            }
          },
          ifPrivate(name) {
            if (isPrivateDependency(name)) {
              reasons.push(`Private dependencies should use "file:" protocol: ${name}`)
            }
          },
        },
      }
      : {
        local(name) {
          reasons.push(`Local dependencies should not be listed in "dependencies": ${name}`)
        },
        semver: {
          ifLocal() {},
          ifPrivate(name) {
            if (isPrivateDependency(name)) {
              reasons.push(`Public package should not use private dependencies: ${name}`)
            }
          },
        },
      }

  const checkDependency = field => {
    const dependencies = manifest[field]
    if (!dependencies) return

    const treatDependency = createDependencyTreater(manifest.private)

    for (const [name, range] of Object.entries(dependencies)) {
      const depManifestPath = path.resolve(container, 'node_modules', name, 'package.json')

      if (!fs.existsSync(depManifestPath)) {
        reasons.push(`Dependency ${name} (${field}) is not installed`)
        continue
      }

      const { name: actualName, version } = require(depManifestPath)
      const parsedVersion = depRange.parse(range)

      if (name.startsWith('@types/')) {
        const globalDependencies = Object.assign(
          {},
          globalManifest.dependencies,
          globalManifest.devDependencies,
        )

        if (name in globalDependencies) {
          const expectedRange = globalDependencies[name]
          if (expectedRange && range !== expectedRange) {
            reasons.push(`Expecting "${name}": "${expectedRange}" but received "${name}": ${range}"`)
          }

          justTry(() => {
            const expectedVersion = require(
              path.resolve(places.project, 'node_modules', name, 'package.json'),
            ).version
            if (version !== expectedVersion) {
              reasons.push(`Expecting ${name}@${expectedVersion} (${field}) but received ${name}@${version} (global)`)
            }
          })
        }
      }

      switch (parsedVersion.type) {
        case depRange.Type.Semver: {
          treatDependency.semver.ifLocal(name)
          treatDependency.semver.ifPrivate(name)

          {
            const condition = actualName !== name || !semver.satisfies(version, range)

            const message = () =>
              `Expecting ${name}@${range} (${field}) but received ${actualName}@${version} (node_modules)`

            pushif(condition, message)
          }
          break
        }

        case depRange.Type.Local: {
          treatDependency.local(name)

          {
            const expected = path.resolve(container, parsedVersion.path)
            const received = fs.realpathSync(path.resolve(container, 'node_modules', name))
            const condition = expected !== received

            const message = () =>
              `Expecting ${name} ("${range}") to be at "${expected}" but received "${received}" instead`

            pushif(condition, message)
          }

          {
            const expected = depRange.LocalUrl.Protocol.File
            const received = parsedVersion.protocol
            const condition = expected !== received

            const message = () => `Expecting "${expected}" as protocol but received "${received}" instead`

            pushif(condition, message)
          }

          break
        }

        case depRange.Type.Git: {
          const condition = parsedVersion.url.protocol === depRange.GitUrl.Protocol.Local

          const message = 'Do not use "git+file:" protocol to link local package, use "file:" instead'

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

  const getResult = () =>
    reasons.length
      ? runner.fail({
        start,
        end: Date.now(),
        test: {
          path: testPath,
          errorMessage: reasons.map(x => '    ' + x).join('\n'),
        },
      })
      : runner.pass({
        start,
        end: Date.now(),
        test: {
          path: testPath,
        },
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
    mustBePublic()
    checkName(containerBaseName, manifest.name)

    for (const key of matchingKeys) {
      if (!manifest[key]) {
        reasons.push(`Missing field "${key}"`)
        continue
      }

      if (!deepEqual(manifest[key], globalManifest[key])) {
        reasons.push(`Field "${key}" does not match its global counterpart`)
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
        ...requiredDependencies.map(name => `Missing dependency "${name}"`),
      )
    }

    return getResult()
  }

  if (resolvedPath.startsWith(places.tools)) {
    mustHaveName()

    const expectedName = `@tools/${containerBaseName}`
    if (manifest.name !== expectedName) {
      reasons.push(
        `Expecting package's name to be "${expectedName}" but received "${manifest.name}" instead`,
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

  {
    const expectedPlaces = Object.values(places).join(' or ')
    reasons.push(`Unexpected path: package.json are expected to be in ${expectedPlaces}`)
    reasons.push(`Hint: Edit ${__filename} to allow new places`)
    return getResult()
  }
}

module.exports = main
