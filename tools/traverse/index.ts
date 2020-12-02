import traverse from 'fast-traverse'
import { readdir, stat } from 'fs-extra'
import { asyncFilter } from 'iter-tools'
import { join } from 'path'
import { pipeline } from 'ts-pipe-compose'

export async function* items(
  dirname: string,
  ignore: readonly string[] = ['.git', 'node_modules'],
) {
  for await (
    const item of traverse({
      dirname,
      join,
      readdir,
      stat,
      deep: x => !ignore.includes(x.basename),
    })
  ) {
    for (const basename of item.list) {
      const path = join(item.dirname, basename)
      const stats = await stat(path)
      yield { ...item, basename, path, stats }
    }
  }
}

export const files = pipeline(
  items,
  asyncFilter(item => item.stats.isFile()),
)

export const jsFiles = pipeline(
  files,
  asyncFilter(item => item.basename.endsWith('.js')),
)
