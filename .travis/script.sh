#!/bin/bash

# Exit on first error, print all commands.
set -ev
set -o pipefail

# Grab the parent (root) directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
ME=`basename "$0"`
echo "-->-- Starting ${ME}"
source ${DIR}/build.cfg
echo "--I-- ${TRAVIS_TAG} ${TRAVIS_BRANCH}"

function _exit(){
    printf "%s Exiting %s because %s exit code:%s\n" "--<--" "${ME}" "$1" "$2"   
    exit $2
}

# determine the release type
if [ -z "${TRAVIS_TAG}" ]; then
    BUILD_RELEASE="unstable"
else
    BUILD_RELEASE="stable"
fi

echo "--I-- Build release is ${BUILD_RELEASE}"

if [ "${ABORT_BUILD}" = "true" ]; then
  _exit "exiting early from" ${ABORT_CODE}
fi

# Start the X virtual frame buffer used by Karma.
if [ -r "/etc/init.d/xvfb" ]; then
    export DISPLAY=:99.0
    sh -e /etc/init.d/xvfb start
fi

# are we building the docs?
if [ "${DOCS}" != "" ]; then

    # Change into the docs directory.
    cd "${DIR}/packages/composer-website"

    # Build the installers.
    ./build-installers.sh

    # Build the documentation.
    npm run doc

    if [[ "${BUILD_RELEASE}" == "unstable" ]]; then
        npm run full:v0.16-unstable
        npm run linkcheck:v0.16-unstable
    elif [[ "${BUILD_RELEASE}" == "stable" ]]; then
        npm run full:v0.16
        npm run linkcheck:v0.16
    else
       _exit "Unkown build release ${BUILD_RELEASE}" 1
    fi

# Are we running functional verification tests?
elif [ "${FVTEST}" != "" ]; then

    # Run the fv tests.
    ${DIR}/packages/composer-tests-functional/scripts/run-fv-tests.sh 
    # append to the previous line to get duration timestamps....  | gnomon --real-time=false 

# Are we running playground e2e tests?
elif [ "${INTEST}" = "e2e" ]; then

    # Run the playground e2e tests.
    cd "${DIR}/packages/composer-playground"
    npm run e2e:main

# Are we running integration tests?
elif [ "${INTEST}" != "" ]; then

    # Run the integration tests.
    ${DIR}/packages/composer-tests-integration/scripts/run-integration-tests.sh 
    # append to the previous line to get duration timestamps....  | gnomon --real-time=false
     
# We must be running unit tests.
else

    # Run the unit tests.
    npm test 2>&1

    # Build the Composer Playground.
    cd "${DIR}/packages/composer-playground"
    npm run build:prod

fi

_exit "All complete" 0