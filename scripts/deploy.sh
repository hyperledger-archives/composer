#!/bin/bash

# Exit on first error, print all commands.
set -ev
set -o pipefail

# Grab the Concerto directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

# Check that this is the right node.js version.
if [ "${TRAVIS_NODE_VERSION}" != "" -a "${TRAVIS_NODE_VERSION}" != "4" ]; then
    echo Not executing as not running primary node.js version.
    exit 0
fi

# Check that this is not the system tests.
if [ "${SYSTEST}" != "" ]; then
    echo Not executing as running system tests.
    exit 0
fi

# Check that this is the main repository.
if [[ "${TRAVIS_REPO_SLUG}" != Blockchain-WW-Labs* ]]; then
    echo "Skipping deploy; wrong repository slug."
    exit 0
fi

# Determine the repository wide version.
export VERSION=$(node -e "console.log(require('$DIR/package.json').version)")

# If this is not for a tagged (release) build, set the prerelease version.
if [ -z "${TRAVIS_TAG}" ]; then
    export TIMESTAMP=$(date +%Y%m%d%H%M%S)
    export VERSION="${VERSION}-${TIMESTAMP}"
    lerna publish --skip-git --npm-tag unstable --force-publish --yes --repo-version "${VERSION}" 2>&1 | tee
else
    lerna publish --skip-git --force-publish --yes --repo-version "${VERSION}" 2>&1 | tee
fi
