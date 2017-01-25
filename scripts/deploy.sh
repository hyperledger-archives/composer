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

# Push the code to npm.
if [ -z "${TRAVIS_TAG}" ]; then

    # Set the prerelease version.
    npm run pkgstamp

    # Publish with unstable tag. These are development builds.
    echo "Pushing with tag unstable"
    lerna exec --ignore '@ibm/concerto-systests' -- npm publish --scope=@ibm --tag=unstable 2>&1 | tee

else

    # Publish with latest tag (default). These are release builds.
    echo "Pushing with tag latest"
    lerna exec --ignore '@ibm/concerto-systests' -- npm publish --scope=@ibm 2>&1 | tee

    # Configure the Git repository and clean any untracked and unignored build files.
    git config user.name "Travis CI"
    git config user.email "noreply@travis.ibm.com"
    git checkout -b develop
    git reset --hard
    git clean -d -f

    # Bump the version number.
    npm run pkgbump
    export VERSION=$(node -e "console.log(require('${DIR}/package.json').version)")

    # Add the version number changes and push them to Git.
    git add .
    git commit -m "Automatic version bump to ${VERSION}"
    git push origin develop

fi
