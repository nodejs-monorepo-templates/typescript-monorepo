export function serialize (json: string): any {
  return JSON.parse(json)
}

export function deserialize (object: any): string {
  return JSON.stringify(object, undefined, 2)
}
