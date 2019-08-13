import process from 'process'
import formatCommand from '../format-command'
import { spawnSync as execInline } from 'exec-inline'
const { SHOW_SPAWN_CMD = 'false' } = process.env

interface SpawnSync {
  (first: string, second: string, ...rest: string[]): ReturnType<typeof execInline>
}

export const spawnSync: SpawnSync = SHOW_SPAWN_CMD.toLowerCase() === 'true'
  ? (...args) => {
    console.info(...formatCommand(...args))
    return execInline(...args)
  }
  : execInline

export default spawnSync
