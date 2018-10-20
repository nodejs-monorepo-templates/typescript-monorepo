import path from 'path'
import process from 'process'
import * as places from '@tools/places'
import { writeIgnoreFiles } from '../../index'
const basename = '.npmignore'
const basefile = path.resolve(places.packages, basename)

writeIgnoreFiles(basefile, basename, '**', places.packages).catch(error => {
  console.error(`[ERROR] An error occurred while writing .npmignore files`)
  console.error(error)
  process.exit(1)
})
