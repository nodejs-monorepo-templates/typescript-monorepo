import { writeFile } from 'fs-extra'
import { serialize } from '../json'

export async function writeJSON (filename: string, object: any) {
  const content = serialize(object) + '\n'
  await writeFile(filename, content)
  return content
}

export default writeJSON
