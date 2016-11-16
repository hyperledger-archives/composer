#!/bin/bash

# Exit on first error, print all commands.
set -ev

# Grab the Concerto directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

# Check for the system tests.
case ${TEST_SUITE} in
system*)
    echo Not executing as running system tests.
    exit 0
    ;;
unit*)
    if [ "${TRAVIS_NODE_VERSION}" != "" -a "${TRAVIS_NODE_VERSION}" != "4" ]; then
        echo Not executing as not running primary node.js version.
        exit 0
    fi
    ;;
esac

# Check that this is the main repository.
if [ "${TRAVIS_REPO_SLUG}" != "Blockchain-WW-Labs/Concerto" ]; then
    echo "Skipping deploy; wrong repository slug."
    exit 0
fi

# If this is not for a tagged (release) build, set the prerelease version.
if [ -z "${TRAVIS_TAG}" ]; then
    node ${DIR}/scripts/timestamp.js ${DIR}/package.json
fi

# Push the code to npm.
npm publish --scope=@ibm
