#! /usr/bin/env bash

echo 'Reporting coverage information...'
stcode=0

echo '  → To Coveralls <https://coveralls.io/>'
cat ./coverage/lcov.info | coveralls
((stcode|=$?))

echo '  → To Codecov <https://codecov.io/>'
codecov
((stcode|=$?))

exit $stcode
