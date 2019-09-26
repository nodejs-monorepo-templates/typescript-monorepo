import process from 'process'
import { publish } from '@tools/gh-pages'
import places from '@tools/places'

export async function main () {
  process.chdir(places.project)
  console.info('Publishing documentation to gh-pages...')
  await publish('docs', { dotfiles: true })
}

export default main
