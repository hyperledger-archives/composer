#!/bin/bash

# Exit on first error, print all commands.
set -ev
set -o pipefail

# Grab the parent (root) directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
ME=`basename "$0"`
echo "-->-- Starting ${ME}"
source ${DIR}/build.cfg
echo "--TAG-- ${TRAVIS_TAG}"
echo "--BRANCH-- ${TRAVIS_BRANCH}"

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

# Set the GitHub deploy key we will use to publish.
set-up-ssh --key "$encrypted_17b59ce72ad7_key" \
           --iv "$encrypted_17b59ce72ad7_iv" \
           --path-encrypted-key ".travis/github_deploy_key.enc"

# push the html documents
# Configure the Git repository and clean any untracked and unignored build files.
git config user.name "${GH_USER_NAME}"
git config user.email "${GH_USER_EMAIL}"
git config push.default simple

echo ${DIR}
cd "${DIR}/packages/composer-website/out"

# Set the target directory to load the GitHub repository.
export TODIR="${DIR}/packages/composer-website/out/gh-pages"

# Load the GitHub repository using the gh-pages branch.
git clone -b gh-pages git@github.com:${TRAVIS_REPO_SLUG}.git ${TODIR}

# Determine where to copy the docs to
if [[ "${BUILD_RELEASE}" == "unstable" ]]; then
    DOCS_DIR="v0.16-unstable"
elif [[ "${BUILD_RELEASE}" == "stable" ]]; then
    DOCS_DIR="v0.16"
else
    _exit "Unkown build release ${BUILD_RELEASE}" 1
fi

echo "--I-- Pushing docs to the ${TODIR}/${DOCS_DIR} sub-folder"

# Should be able to copy all the docs as needed
mkdir -p ${TODIR}/${DOCS_DIR}
rm -rf ${TODIR}/${DOCS_DIR}/*
cp -rf ${DIR}/packages/composer-website/jekylldocs/_site/* ${TODIR}/${DOCS_DIR}/

# Add all the changes, commit, and push to the GitHub repository.
cd ${TODIR}
git add .
git commit -m "Automatic deployment of website"
git push origin gh-pages

_exit "All complete" 0
