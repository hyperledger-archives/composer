#!/bin/bash
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

# Exit on first error, print all commands.
set -ev
set -o pipefail

# Bring in the standard set of script utilities
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
source ${DIR}/.travis/base.sh
# ----

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
if git status --porcelain | grep . > /dev/null; then
    echo "Found doc changes to push"
    git add .
    git commit -m "Automatic deployment of website"
    git push origin gh-pages
else
    echo "No doc changes to push"
fi

_exit "All complete" 0
