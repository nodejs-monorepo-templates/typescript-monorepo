#! /usr/bin/env bash

echo 'Installing additional tools for CI...'

pnpm install --global --shamefully-flatten \
  coveralls@latest codecov@latest

exit 0 # Always success
