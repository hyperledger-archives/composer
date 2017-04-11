#!/bin/bash

# Exit on first error, print all commands.
set -ev
set -o pipefail

# Grab the Concerto directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
ME=`basename "$0"`

echo ${ME} `date`

echo ${TRAVIS_COMMIT}
echo ${CF_ORGANIZATION}
echo ${DOCKER_USERNAME}

source ${DIR}/build.cfg

if [ "${ABORT_BUILD}" = "true" ]; then
  echo "-#- exiting early from ${ME}"
  exit ${ABORT_CODE}
fi


# Start the X virtual frame buffer used by Karma.
if [ -r "/etc/init.d/xvfb" ]; then
    export DISPLAY=:99.0
    sh -e /etc/init.d/xvfb start
fi


# are we building the docs?
if [ "${DOCS}" != "" ]; then
    if [ -n "${TRAVIS_TAG}" ]; then
        export JEKYLL_ENV=production
    fi
	cd "${DIR}/packages/composer-website"
	npm install
	npm run full
# Are we running system tests?
elif [ "${SYSTEST}" != "" ]; then

    # Run the system tests.
    ${DIR}/packages/composer-systests/scripts/run-system-tests.sh

# We must be running unit tests.
else

    # Run the unit tests.
    npm test 2>&1 | tee

    # Build the Composer UI.
    cd "${DIR}/packages/composer-ui"
    npm run build:prod

    # Build the Composer Playground.
    cd "${DIR}/packages/composer-playground"
    npm run build:prod

fi

echo ${ME} `date`
