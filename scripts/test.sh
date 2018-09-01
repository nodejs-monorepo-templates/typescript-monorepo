#! /usr/bin/env bash

function delim () {
  echo ''
  echo ''
}

clean-typescript-build || exit $?

delim
jest --coverage $@ || exit $?
