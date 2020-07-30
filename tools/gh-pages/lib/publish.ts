import ghPages from 'gh-pages'

export interface Options extends ghPages.PublishOptions {}

export const publish = (path: string, options: Options = {}) =>
  new Promise<void>(
    (resolve, reject) =>
      ghPages.publish(
        path,
        options,
        error => error ? reject(error) : resolve(),
      ),
  )

export default publish
