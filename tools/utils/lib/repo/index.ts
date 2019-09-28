import { parse, format } from 'url'
import { loadRootManifest } from '../manifest'

export function getRepoUrl (gitUrl: string) {
  const object = parse(gitUrl)
  const { protocol } = object

  if (!protocol) return gitUrl

  for (const newProtocol of ['http', 'https']) {
    if (protocol.includes(newProtocol + ':') || protocol.includes(newProtocol + '+')) {
      object.protocol = newProtocol + ':'
      break
    }
  }

  return format(object)
}

export function loadGitUrl () {
  return loadRootManifest().repository.url
}

export function loadRepoUrl () {
  return getRepoUrl(loadGitUrl())
}
