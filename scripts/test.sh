#! /usr/bin/env bash

function delim () {
  echo ''
  echo ''
}

bash scripts/clean-typescript-build.sh || exit $?

delim
node tools/jest/bin.js --coverage $@ || exit $?
