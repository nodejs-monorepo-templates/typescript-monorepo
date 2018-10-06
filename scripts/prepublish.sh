#! /usr/bin/env bash

echo 'Checking for mismatched versions...'
bash scripts/mismatches.sh || exit $?

echo 'Running unit tests....'
bash scripts/test.sh || exit $?
