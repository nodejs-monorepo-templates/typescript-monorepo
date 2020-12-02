import * as places from '@tools/places'
import fs from 'fs'
import { statusMatrix } from 'isomorphic-git'
import { Printer } from '../utils/types'
import { command } from './command'
import { StyledText, normal, dim, bold } from './styled-text'

export interface EnvironmentVariables {
  readonly PUBLISH_TAG_PUSH_EXECUTOR?: string
  readonly PUBLISH_TAG_PUSH_VCS?: string
  readonly PUBLISH_TAG_PUSH_REMOTE?: string
  readonly PUBLISH_TAG_PUSH_BRANCH?: string
}

export interface Process {
  readonly env: EnvironmentVariables
}

export interface Options {
  readonly print: Printer
  readonly printErr: Printer
  readonly process: Process
}

export async function main(options: Options): Promise<number> {
  const { print, printErr, process } = options
  const { env } = process
  const npm = env.PUBLISH_TAG_PUSH_EXECUTOR || 'npm'
  const git = env.PUBLISH_TAG_PUSH_VCS || 'git'
  const remote = env.PUBLISH_TAG_PUSH_REMOTE || 'origin'
  const branch = env.PUBLISH_TAG_PUSH_BRANCH || 'master'

  const changes = (await statusMatrix({ fs, dir: places.project }))
    .filter(([_, a, b, c]) => a !== 1 || b !== 1 || c !== 1)
  if (changes.length) {
    printErr('[ERROR] Repo is not clean')
    for (const [filename] of changes) {
      printErr('  → ' + filename)
    }
    return 1
  }

  const exec = (cmd: StyledText, ...args: StyledText[]) => command(print, cmd, args)
  await exec(dim(npm), dim('run'), bold('project-publish'))
  await exec(dim(npm), dim('run'), bold('git-tag-versions'))
  await exec(dim(git), bold('push'), normal(remote), normal('--tags'), normal(branch))

  return 0
}

export default main
