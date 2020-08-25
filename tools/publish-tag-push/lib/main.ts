import fs from 'fs'
import { statusMatrix } from 'isomorphic-git'
import * as places from '@tools/places'
import { Printer } from '../utils/types'
import { StyledText, normal, dim, bold } from './styled-text'
import { command } from './command'

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

  const changes = await statusMatrix({ fs, dir: places.project })
  if (changes.length) {
    printErr('[ERROR] Repo is not clean')
    for (const [filename] of changes) {
      printErr('  → ' + filename)
    }
  }

  const exec = (cmd: StyledText, ...args: StyledText[]) => command(print, cmd, args)
  await exec(dim(npm), dim('run'), bold('project-publish'))
  await exec(dim(npm), dim('run'), bold('git-tag-versions'))
  await exec(dim(git), bold('push'), normal(remote), normal('--tags'), normal(branch))

  return 0
}

export default main
