import path from 'path'
import { readFile, writeFile } from 'fs-extra'
import { jsFiles } from '@tools/traverse'
import * as places from '@tools/places'

export async function main() {
  const promises: Promise<void>[] = []

  for await (const item of jsFiles(places.packages)) {
    promises.push(
      Promise.resolve().then(async () => {
        const oldText = await readFile(item.path, 'utf8')
        const { name } = path.parse(item.path)
        const dtsFileName = name + '.d.ts'
        const newText = [
          `/// <reference types="./${dtsFileName}" />`,
          oldText,
        ].join('\n')
        await writeFile(item.path, newText)
      }),
    )
  }

  await Promise.all(promises)
}

export default main
