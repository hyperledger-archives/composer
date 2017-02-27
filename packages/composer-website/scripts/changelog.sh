#!/bin/bash

# Exit on first error, print all commands.
set -ev

# Grab the Concerto directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"


${DIR}/node_modules/.bin/github-changes --owner fabric-composer --repository fabric-composer --between-tags v0.4.0...upcoming --auth --no-merges --date-format YYYY/MM/DD

cp ${DIR}/scripts/changelog-header.txt ${DIR}/jekylldocs/support/changelog.md && cat ${DIR}/CHANGELOG.md >> ${DIR}/jekylldocs/support/changelog.md
