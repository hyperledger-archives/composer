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

## regexp to match the latest version
LATEST_REGEXP=v0\.16\.\([0-9]{1,2}\|x\)
NEXT_REGEXP=v0\.17\.\([0-9]{1,2}\|x\)

## determine the build type here
if [ -z "${TRAVIS_TAG}" ]; then
    if [ "${TRAVIS_BRANCH}" = "master" ]; then
        BUILD_FOCUS="next"
        BUILD_RELEASE="unstable"
    elif [[ "${TRAVIS_BRANCH}" =~ ${LATEST_REGEXP} ]]; then
        BUILD_FOCUS="latest"
        BUILD_RELEASE="unstable"
    else 
        _exit "unable to determine build focus ${TRAVIS_BRANCH} ${TRAVIS_TAG}" 1
    fi
else
    if [[ "${TRAVIS_BRANCH}" =~ ${NEXT_REGEXP} ]]; then
        BUILD_FOCUS="next"
        BUILD_RELEASE="stable"
    elif [[ "${TRAVIS_BRANCH}" =~ ${LATEST_REGEXP} ]]; then
        BUILD_FOCUS="latest"
        BUILD_RELEASE="stable"
    else 
        _exit "unable to determine build focus ${TRAVIS_BRANCH} ${TRAVIS_TAG}" 1
    fi
fi

echo "--I-- Build focus is ${BUILD_FOCUS}"
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