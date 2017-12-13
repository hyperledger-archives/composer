#!/bin/bash

# Exit on first error, print all commands.
set -ev
set -o pipefail

# Grab the parent directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
ME=`basename "$0"`

echo "-->-- Starting ${ME}"
source ${DIR}/build.cfg

if [ "${ABORT_BUILD}" = "true" ]; then
  echo "-#- Exiting early from ${ME}"
  exit ${ABORT_CODE}
fi

# Use lerna bootstrap and not npm install; it's a lot faster in Travis.
cd ${DIR}
lerna bootstrap 2>&1

echo "--<-- Exiting ${ME}"
