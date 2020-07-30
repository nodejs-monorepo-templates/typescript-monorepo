import { StyledText, dim } from './styled-text'
import spawn, { TerminationError, SpawnFactory } from 'advanced-spawn-async'
import { Printer } from '../utils/types'

export function displayCommand(args: readonly StyledText[]): string {
  return [dim('$'), ...args]
    .map(x => x.styled)
    .join(' ')
}

const spawnOptions = {
  stdio: 'inherit',
} as const

export async function executeCommand(command: StyledText, args: readonly StyledText[]) {
  await spawn(
    command.normal.toString(),
    args.map(x => x.normal.toString()),
    spawnOptions,
  ).onclose
}

export function command(print: Printer, command: StyledText, args: readonly StyledText[]) {
  print(displayCommand([command, ...args]))
  return executeCommand(command, args)
}

export function handleTerminationError(error: any): number {
  if (error instanceof TerminationError) {
    return (error.info as SpawnFactory.TerminationInformation<never>).status
  }

  throw error
}
