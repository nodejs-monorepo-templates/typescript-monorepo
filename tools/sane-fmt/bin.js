#! /usr/bin/env node
require('./index').execute().catch(error => {
  console.error(error)
  return require('process').exit(1)
})
