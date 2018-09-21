import path from 'path'
import {existsSync} from 'fs'
import {project} from '@tools/places'

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
