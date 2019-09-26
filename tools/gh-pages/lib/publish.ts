import ghPages from 'gh-pages'

export const publish = (path: string) => new Promise<void>(
  (resolve, reject) => ghPages.publish(
    path,
    error => error ? reject(error) : resolve()
  )
)

export default publish
