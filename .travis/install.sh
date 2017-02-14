#!/bin/bash

# Exit on first error, print all commands.
set -ev
set -o pipefail

# Grab the Concerto directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
ME=`basename "$0"`


if [ "${ABORT_BUILD}" = "true" ]; then
  echo exiting early from ${ME}
  exit ${ABORT_CODE}
fi


cd ${DIR}
npm install 2>&1 | tee
