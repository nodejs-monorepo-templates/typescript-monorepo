import path from 'path'
import { parse } from 'json5'
import { readFile } from 'fs-extra'
import places from '@tools/places'

async function load () {
  const tsConfigFile = path.join(places.project, 'tsconfig.json')
  const jsonString = await readFile(tsConfigFile, 'utf8')
  const tsConfigObject = parse(jsonString)
  return tsConfigObject
}

export const tsConfig = load()
export default tsConfig
