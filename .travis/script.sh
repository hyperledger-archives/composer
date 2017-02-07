#!/bin/bash

# Exit on first error, print all commands.
set -ev
set -o pipefail

# Grab the Concerto directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

# Start the X virtual frame buffer used by Karma.
if [ -r "/etc/init.d/xvfb" ]; then
    export DISPLAY=:99.0
    sh -e /etc/init.d/xvfb start
fi


# are we building the docs?
if [ "${DOCS}" != "" ]; then
	cd ${DIR}/site
	npm install
	npm run full
  cd ${DIR}
  ./.travis/deploy_staging_docs.#!/bin/sh
  
# Are we running system tests?
elif [ "${SYSTEST}" != "" ]; then

    # Run the system tests.
    ${DIR}/packages/composer-systests/scripts/run-system-tests.sh

# We must be running unit tests.
else

    # Run the unit tests.
    npm test 2>&1 | tee

    # Build the Composer UI.
    cd ${DIR}/packages/composer-ui
    npm run build:prod

fi
