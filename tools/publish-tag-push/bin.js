const process = require('process')
const { main, handleTerminationError } = require('./index')

main({
  print: console.info,
  process,
})
  .catch(handleTerminationError)
  .then(
    status => process.exit(status),
    error => {
      console.error(error)
      process.exit(-1)
    },
  )
