#!/bin/bash

# Exit on first error, print all commands.
set -ev

# Grab the Concerto directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

# Pull requests and commits to other branches shouldn't try to deploy, just build to verify.
if [ -n "${JOB_NAME+x}" ]; then
    if [ "$JOB_NAME" = "Concerto-PR" ]; then
        echo "Skipping deploy; just doing a build."
        exit 0
    fi
elif [ -n "${TRAVIS_PULL_REQUEST+x}" ]; then
    if [ "$TRAVIS_PULL_REQUEST" != "false" ]; then
        echo "Skipping deploy; just doing a build."
        exit 0
    fi
fi

# Checkout the existing gh-pages branch.
REPO=`git config remote.origin.url`
cd ${DIR}
rm -rf gh-pages
git clone ${REPO} gh-pages
cd gh-pages
git checkout gh-pages || git checkout --orphan gh-pages

# Determine the git branch name.
if [ -n "${GIT_BRANCH+x}" ]; then
    export BRANCH_NAME=$(echo ${GIT_BRANCH} | sed 's|.*/||')
elif [ -n "${TRAVIS_BRANCH+x}" ]; then
    export BRANCH_NAME=${TRAVIS_BRANCH}
else
    echo "Skipping deploy; can't determine branch name."
    exit 0;
fi

# Delete all of the existing files (public).
export TODIR=${DIR}/gh-pages/jsdoc/${BRANCH_NAME}
mkdir -p ${TODIR}/
rm -rf ${TODIR}/*

# Copy the new files into place (public).
cp -rf ${DIR}/out/public/* ${TODIR}/
cp -rf ${DIR}/out/diagrams ${TODIR}/

# Delete all of the existing files (private).
export TODIR=${DIR}/gh-pages/jsdoc/${BRANCH_NAME}-private
mkdir -p ${TODIR}/
rm -rf ${TODIR}/*

# Copy the new files into place (private).
cp -rf ${DIR}/out/private/* ${TODIR}/
cp -rf ${DIR}/out/diagrams-private ${TODIR}/

# Set the username address.
cd ${DIR}/gh-pages
git config user.email "noreply@ibm.com"
git config user.name "Blockchain WW Labs - Solutions"
git config push.default simple

# If there are no changes to the compiled out (e.g. this is a README update) then just bail.
git add --all -N jsdoc
if git diff --quiet jsdoc; then
    echo "No changes to the output on this push; exiting."
    exit 0
fi

# Add, commit, and push the changes.
git add --all jsdoc
git commit -m "Automated deploy to GitHub Pages"
git push

# Delete the checked out gh-pages branch.
cd ${DIR}
rm -rf gh-pages
