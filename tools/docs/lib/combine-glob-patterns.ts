import minimatch, { IOptions } from 'minimatch'

export interface GlobTester {
  (name: string): boolean
}

const DEFAULT = () => false as const

const options: IOptions = {
  dot: true
}

export const combineGlobPatterns = (
  globPatterns: readonly string[],
  prev: GlobTester = DEFAULT
) => globPatterns.reduce(
  (acc, pattern) => target => acc(target) || minimatch(target, pattern, options),
  prev
)

export default combineGlobPatterns
