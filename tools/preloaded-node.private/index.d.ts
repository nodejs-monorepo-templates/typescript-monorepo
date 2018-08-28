import {
  SpawnOptions,
  SpawnSyncOptions,
  SpawnSyncOptionsWithBufferEncoding,
  SpawnSyncOptionsWithStringEncoding,
  ChildProcess,
  SpawnSyncReturns
} from 'child_process'

export type Argv = string[]
export const bin: string
export function spawn (argv?: Argv, options?: SpawnOptions): ChildProcess
export function spawnSync(): SpawnSyncReturns<Buffer>
export function spawnSync(argv: Argv): SpawnSyncReturns<Buffer>
export function spawnSync(options: SpawnSyncOptions | SpawnSyncOptionsWithBufferEncoding): SpawnSyncReturns<Buffer>
export function spawnSync(options: SpawnSyncOptionsWithStringEncoding): SpawnSyncReturns<string>
export function spawnSync(argv: Argv, options: SpawnSyncOptions | SpawnSyncOptionsWithBufferEncoding): SpawnSyncReturns<Buffer>
export function spawnSync(argv: Argv, options: SpawnSyncOptionsWithStringEncoding): SpawnSyncReturns<string>
