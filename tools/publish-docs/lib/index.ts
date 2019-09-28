import process from 'process'
import { publish, Options } from '@tools/gh-pages'
import places from '@tools/places'

const DEFAULT_OPTIONS: Options = { dotfiles: true }

export async function main () {
  process.chdir(places.project)
  console.info('Publishing documentation to gh-pages...')
  await publish('docs', { ...DEFAULT_OPTIONS })
}

export default main
