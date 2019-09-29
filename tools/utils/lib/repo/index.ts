import fs from 'fs'

export async function loadRepoUrl (remote = 'origin') {
  const git = await import('isomorphic-git')
  const { project } = await import('@tools/places')

  git.plugins.set('fs', fs)

  for (const item of await git.listRemotes({ dir: project })) {
    if (item.remote === remote) {
      return item.url
    }
  }

  throw new Error(`Cannot find remote of ${JSON.stringify(remote)}`)
}
