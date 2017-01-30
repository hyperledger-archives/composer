#!/bin/bash

# Exit on first error, print all commands.
set -ev

# Grab the Composer directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

# Check that this is the right node.js version.
if [ "${TRAVIS_NODE_VERSION}" != "" -a "${TRAVIS_NODE_VERSION}" != "4" ]; then
    echo Not executing as not running primary node.js version.
    exit 0
fi

# Check that this is the main repository.
if [[ "${TRAVIS_REPO_SLUG}" != Blockchain-WW-Labs* ]]; then
    echo "Skipping deploy; wrong repository slug."
    exit 0
fi

# If this is not for a tagged (release) build, set the prerelease version.
if [ -z "${TRAVIS_TAG}" ]; then
    node ${DIR}/scripts/timestamp.js ${DIR}/package.json
fi

# Push the code to npm.
if [ "${TRAVIS_BRANCH}" = "develop" ]; then

    # Publish with unstable tag. These are development builds.
    echo "Pushing with tag unstable"
    npm publish --tag=unstable

else

    # Publish with latest tag (default). These are release builds.
    echo "Pushing with tag develop"
    npm publish

fi

# If this is a tagged (release) build, don't go pushing to downstream projects.
if [ -n "${TRAVIS_TAG}" ]; then
    echo "Skipping downstream push; build is tagged"
    exit 0
fi
