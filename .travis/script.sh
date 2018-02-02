#!/bin/bash

# Exit on first error, print all commands.
set -ev
set -o pipefail

# Bring in the standard set of script utilities
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
source ${DIR}/.travis/base.sh
# ----
env | grep TRAVIS

# Start the X virtual frame buffer used by Karma.
if [ -r "/etc/init.d/xvfb" ]; then
    export DISPLAY=:99.0
    sh -e /etc/init.d/xvfb start
fi


# are we building the docs?
if [ "${DOCS}" != "" ]; then

    # Change into the docs directory.
    cd "${DIR}/packages/composer-website"

    # Build the documentation.
    npm run doc

    if [[ "${BUILD_RELEASE}" == "unstable" ]]; then

        if [[ "${BUILD_FOCUS}" = "latest" ]]; then
            npm run full:unstable
            npm run linkcheck:unstable
        elif [[ "${BUILD_FOCUS}" = "next" ]]; then
            npm run full:next-unstable
            npm run linkcheck:next-unstable
        else 
            _exit "Unknown build focus" 1 
        fi

    elif [[ "${BUILD_RELEASE}" == "stable" ]]; then

        if [[ "${BUILD_FOCUS}" = "latest" ]]; then
            npm run full:latest
            npm run linkcheck:latest
        elif [[ "${BUILD_FOCUS}" = "next" ]]; then
            npm run full:next
            npm run linkcheck:next
        else 
            _exit "Unknown build focus" 1 
        fi

    else
       _exit "Unkown build release or focus ${BUILD_RELEASE} ${BUILD_FOCUS}" 1
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
