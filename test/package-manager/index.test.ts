import path from 'path'
import { existsSync } from 'fs'
import { spawnSync } from 'child_process'
import semver from 'semver'
import { project } from '@tools/places'

const mkfn = (file: string, pkgmgr: string) => () => {
  if (existsSync(path.resolve(project, file))) {
    console.info([
      `This project does not use ${pkgmgr} to install/link its dependencies.`,
      'Please use pnpm instead.',
      'More info at: https://pnpm.js.org/'
    ].join('\n'))

    throw new Error(`File ${file} detected.`)
  }
}

it('Not using npm', mkfn('package-lock.json', 'npm'))
it('Not using yarn', mkfn('yarn.lock', 'yarn'))

it('Using correct version of pnpm', () => {
  const { stdout, stderr, status, error, signal } = spawnSync('pnpm', ['--version'], { encoding: 'utf8' })

  if (status || error) {
    console.info({ status, error, signal, stderr })
    throw new Error('Failed to run "pnpm --version"')
  }

  const { engines } = require(path.resolve(project, 'package.json'))
  const range = engines && engines.pnpm

  if (!range) {
    throw new Error(`Missing engines.pnpm in package.json`)
  }

  const version = stdout.trim()

  if (!semver.satisfies(version, range)) {
    throw new Error(`Expecting pnpm@'${range}' but received pnpm@${version}.`)
  }
})
