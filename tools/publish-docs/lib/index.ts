import process from 'process'
import { publish, Options } from '@tools/gh-pages'
import places from '@tools/places'
import { optionsList } from './config'

const DEFAULT_OPTIONS: Options = { dotfiles: true }

export async function main () {
  process.chdir(places.project)
  console.info('Publishing documentation...')

  for (const options of optionsList) {
    const fullOptions = { ...DEFAULT_OPTIONS, ...options }
    console.info('gh-pages>', fullOptions)
    await publish('docs', fullOptions)
  }
}

export default main
