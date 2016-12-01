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

if [[ "${TEST_SUITE}" != "systest_hlf" ]]; then
    echo "Skipping deploy; wrong test suite."
    exit 0
fi

# Push empty commits to downstream projects to trigger builds.
REPO=`git config remote.origin.url`
for PROJ in Concerto; do
    cd ${DIR}
    THISREPO=$(echo ${REPO} | sed "s|/[^/]*$||")/${PROJ}.git
    rm -rf temp
    git clone ${THISREPO} temp
    cd temp
    git config user.email "noreply@ibm.com"
    git config user.name "Blockchain WW Labs - Solutions"
    git config push.default simple
    git commit -m "Automated commit to trigger downstream build" --allow-empty
    git push
done
