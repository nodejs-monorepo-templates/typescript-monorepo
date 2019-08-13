import { writeFile } from 'fs-extra'
import { deserialize } from '../json'

export async function writeJSON (filename: string, object: any) {
  const content = deserialize(object) + '\n'
  await writeFile(filename, content)
  return content
}

export default writeJSON
