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

# Install the travis command line
gem install travis -v 1.8.8 --no-rdoc --no-ri
travis version
travis login --no-interactive --github-token f6008654988371c41ccc1661eaa800fcbe520420
travis whoami

# Check of the task current executing
#if [ ${FC_TASK}" = "docs" ]; then
  #echo Doing Docs - no requirement for installations of other software
  #exit 0;
#fi


cd ${DIR}
npm install 2>&1 | tee
