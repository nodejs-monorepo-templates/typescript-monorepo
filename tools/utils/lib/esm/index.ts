export type ESM<Target> = Target & {
  readonly default: ESM<Target>
}

/**
 * Turn `object` into an ES module
 * @template Target
 * @param object Object
 * @param value Value of "__esModule" property
 */
export function setEsModule<Target>(object: Target, value = true): ESM<Target> {
  Object.defineProperty(object, '__esModule', { value })
  return Object.assign(object, { default: object }) as any
}

export const esm = setEsModule

export default setEsModule
