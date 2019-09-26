import process from 'process'
import ghPages from 'gh-pages'
import places from '@tools/places'

export const publishDocs = (docs: string) => new Promise<void>(
  (resolve, reject) => ghPages.publish(
    docs,
    error => error ? reject(error) : resolve()
  )
)

export async function main () {
  process.chdir(places.project)
  console.info('Publishing documentation to gh-pages...')
  await publishDocs('docs')
}

export default main
