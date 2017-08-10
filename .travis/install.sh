#!/bin/bash

# Exit on first error, print all commands.
set -ev
set -o pipefail

# Grab the Concerto directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
ME=`basename "$0"`

source ${DIR}/build.cfg

if [ "${ABORT_BUILD}" = "true" ]; then
  echo "-#- Exiting early from ${ME}"
  exit ${ABORT_CODE}
fi

# Check of the task current executing
#if [ ${FC_TASK}" = "docs" ]; then
  #echo Doing Docs - no requirement for installations of other software
  #exit 0;
#fi

# Use lerna bootstrap and not npm install; it's a lot faster in Travis.
cd ${DIR}
lerna bootstrap 2>&1
