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


if [[ "${BUILD_RELEASE}" == "unstable" ]]; then

    if [[ "${BUILD_FOCUS}" = "latest" ]]; then
        DOCS_DIR="unstable"
    elif [[ "${BUILD_FOCUS}" = "next" ]]; then
        DOCS_DIR="next-unstable"
    else 
        _exit "Unknown build focus" 1 
    fi

elif [[ "${BUILD_RELEASE}" == "stable" ]]; then

    if [[ "${BUILD_FOCUS}" = "latest" ]]; then
        DOCS_DIR="latest"
    elif [[ "${BUILD_FOCUS}" = "next" ]]; then
        DOCS_DIR="next"
    else 
        _exit "Unknown build focus" 1 
    fi

else
    _exit "Unkown build release or focus ${BUILD_RELEASE} ${BUILD_FOCUS}" 1
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
