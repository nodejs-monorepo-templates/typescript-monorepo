export interface LogFunc {
  (...args: any[]): void
}

/**
 * Create a logger function
 * @param silent Where to log to
 * @param log Log function
 */
export function createLogger (silent: boolean, log: LogFunc = console.info) {
  return silent ? () => undefined : log
}

export const logger = createLogger

export default createLogger
