import process from 'process'
import { publish, Options } from '@tools/gh-pages'
import places from '@tools/places'
import { optionsList } from './config'

const DEFAULT_OPTIONS: Options = { dotfiles: true }

export async function main () {
  process.chdir(places.project)
  console.info('Publishing documentation...')

  for (const options of optionsList) {
    console.info('gh-pages>', options)
    await publish('docs', { ...DEFAULT_OPTIONS, ...options })
  }
}

export default main
