#!/bin/bash

# Exit on first error, print all commands.
set -ev

# Grab the Concerto directory.
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
    npm publish --scope=@ibm --tag=unstable

else

    # Publish with latest tag (default). These are release builds.
    echo "Pushing with tag develop"
    npm publish --scope=@ibm

fi

# If this is a tagged (release) build, don't go pushing to downstream projects.
if [ -n "${TRAVIS_TAG}" ]; then
    echo "Skipping downstream push; build is tagged"
    exit 0
fi

# Push empty commits to downstream projects to trigger builds.
# TODO: remove this 'exit 0' when we need to trigger downstream builds.
exit 0
REPO=`git config remote.origin.url`
for PROJ in Concerto-System-Tests; do
    cd ${DIR}
    THISREPO=$(echo ${REPO} | sed "s|/[^/]*$||")/${PROJ}.git
    for i in {1..5}; do
        rm -rf temp
        git clone -b ${TRAVIS_BRANCH} ${THISREPO} temp
        cd temp
        git config user.email "noreply@ibm.com"
        git config user.name "Blockchain WW Labs - Solutions"
        git config push.default simple
        git commit -m "Automated commit to trigger downstream build" --allow-empty
        git push && break
    done
done
