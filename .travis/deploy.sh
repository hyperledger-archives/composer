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

# Script for the deploy phase, to push NPM modules, docker images and
# cloud playground images

# Exit on first error, print all commands.
set -ev
set -o pipefail

# Bring in the standard set of script utilities
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
source ${DIR}/.travis/base.sh

# ----

# Check that this is not the functional verification tests.
if [ "${FVTEST}" != "" ]; then
    _exit "Not executing as running fv tests." 0
fi

# Check that this is not the integration tests.
if [ "${INTEST}" != "" ]; then
    _exit "Not executing as running integration tests." 0
fi

# Check that this is the main repository.
if [[ "${TRAVIS_REPO_SLUG}" != hyperledger* ]]; then
    _exit "Skipping deploy; wrong repository slug." 0
fi

# are we building the docs?
if [ "${DOCS}" != "" ]; then
  ./.travis/deploy_docs.sh
  _exit "Run the docs build" $?
fi

# Required function for checking Docker image existence
function exists() {
    docker pull hyperledger/$*;
    return $?
}

## Start of release process

# Set the NPM access token we will use to publish.
npm config set registry https://registry.npmjs.org/
npm config set //registry.npmjs.org/:_authToken ${NPM_TOKEN}

# Set the GitHub deploy key we will use to publish.
set-up-ssh --key "$encrypted_17b59ce72ad7_key" \
           --iv "$encrypted_17b59ce72ad7_iv" \
           --path-encrypted-key ".travis/github_deploy_key.enc"

# This is the list of all npm modules for composer to be published
export ALL_NPM_MODULES=("composer-admin composer-cli composer-client composer-common composer-connector-embedded composer-connector-hlfv1 composer-connector-proxy composer-connector-server composer-connector-web composer-cucumber-steps composer-documentation composer-playground composer-playground-api composer-report composer-rest-server composer-runtime composer-runtime-embedded composer-runtime-hlfv1 composer-runtime-pouchdb composer-runtime-web composer-wallet-filesystem composer-wallet-inmemory generator-hyperledger-composer loopback-connector-composer")

# This is the list of npm modules required by docker images
export DOCKER_NPM_MODULES="composer-admin composer-client composer-cli composer-common composer-report composer-playground composer-playground-api composer-rest-server loopback-connector-composer composer-wallet-filesystem composer-wallet-inmemory composer-connector-server composer-documentation composer-connector-hlfv1 composer-connector-proxy"

# This is the array of Docker images to build and publish.
export ALL_DOCKER_IMAGES=("composer-playground" "composer-rest-server" "composer-cli")
# This is the final array of Docker images that will be published
export PUBLISH_DOCKER_IMAGES=("composer-playground" "composer-rest-server" "composer-cli")

# Change from HTTPS to SSH.
./.travis/fix_github_https_repo.sh

# Test the GitHub deploy key.
git ls-remote

# Log in to Docker Hub.
docker login -u="${DOCKER_USERNAME}" -p="${DOCKER_PASSWORD}"

# Determine the details of the suffixes for playground and NPM/docker tags
if [[ "${BUILD_RELEASE}" == "unstable" ]]; then

    # Set the prerelease version.
    npm run pkgstamp
   
    if [[ "${BUILD_FOCUS}" == "latest" ]]; then
        PLAYGROUND_SUFFIX="-unstable"      
        WEB_CFG="{\"webonly\":true}"
        TAG="unstable"
    elif [[ "${BUILD_FOCUS}" == "next" ]]; then
        PLAYGROUND_SUFFIX="-next-unstable"
        WEB_CFG="{\"webonly\":true}"      
        TAG="next-unstable"
    else 
        _exit "Unknown build focus" 1 
    fi
elif  [[ "${BUILD_RELEASE}" == "stable" ]]; then
    if [[ "${BUILD_FOCUS}" == "latest" ]]; then
        PLAYGROUND_SUFFIX=""      
        WEB_CFG="{\"webonly\":true}"
        TAG="latest"
    elif [[ "${BUILD_FOCUS}" == "next" ]]; then
        PLAYGROUND_SUFFIX="-next"
        WEB_CFG="{\"webonly\":true}"
        TAG="next"
    else 
        _exit "Unknown build focus" 1 
    fi
fi

# Hold onto the version number
export VERSION=$(node -e "console.log(require('${DIR}/package.json').version)")

# Determine which npm modules to ignore on the publish
export IGNORE_NPM_MODULES=();
export IGNORE="composer-tests-integration|composer-tests-functional|composer-website"
for m in "${ALL_NPM_MODULES[@]}"; do
    echo "Checking for existence of npm module ${m}"
    if npm view ${m}@${VERSION} | grep dist-tags > /dev/null 2>&1; then
        echo "-module ${m} exists, will ignore in publish"
        IGNORE_NPM_MODULES+=("${m}")
        IGNORE+="|${m}"
    fi
done

# Only enter here if ignore array is not same length as the publish array
if [ "${#ALL_NPM_MODULES[@]}" -ne "${#IGNORE_NPM_MODULES[@]}" ]; then
    # Publish with tag
    echo "Pushing with tag ${TAG}"
    lerna exec --ignore '@('${IGNORE}')' -- npm publish --tag="${TAG}" 2>&1
else
    echo "All npm modules with tag ${VERSION} exist, skipping publish phase"
fi

# Check that all required modules for docker have been published to npm and are retrievable
for j in ${DOCKER_NPM_MODULES}; do
    # check the next in the list
    while ! npm view ${j}@${VERSION} | grep dist-tags > /dev/null 2>&1; do
        sleep 10
    done
done

# Check which Docker images to publish, we need to temporarily disable the 'e' flag here as we rely on a failure
set +e
echo "Checking for Docker images with version ${VERSION}"
for i in "${ALL_DOCKER_IMAGES[@]}"; do
    echo "Checking for existence of Docker image ${i}"
    # Perform a pull on the version, it will fail if it does not exist
    if exists "${i}:${VERSION}" ; then
        echo "-image ${i}:${VERSION} exists, will not publish"
        # Remove from publish array
        for (( j=0; j<${#PUBLISH_DOCKER_IMAGES[@]}; j++ )); do 
            if [[ ${PUBLISH_DOCKER_IMAGES[j]} == ${i} ]]; then
                PUBLISH_DOCKER_IMAGES=( "${PUBLISH_DOCKER_IMAGES[@]:0:$j}" "${PUBLISH_DOCKER_IMAGES[@]:$((j + 1))}" )
            fi
        done
    fi
done
set -e

# Conditionally build, tag, and publish Docker images based on the resulting array
for i in ${PUBLISH_DOCKER_IMAGES[@]}; do

    # Build the image and tag it with the version and unstable.
    docker build --build-arg VERSION=${VERSION} -t hyperledger/${i}:${VERSION} ${DIR}/packages/${i}/docker
    docker tag hyperledger/${i}:${VERSION} hyperledger/${i}:"${TAG}"

    # Push both the version and unstable.
    docker push hyperledger/${i}:${VERSION}
    docker push hyperledger/${i}:${TAG}
done

# Push to public Bluemix for stable and unstable, latest and next release builds
if [[ "${BUILD_FOCUS}" != "v0.16" ]]; then
    pushd ${DIR}/packages/composer-playground
    rm -rf ${DIR}/packages/composer-playground/node_modules
    cf login -a https://api.ng.bluemix.net -u ${CF_USERNAME} -p ${CF_PASSWORD} -o ${CF_ORGANIZATION} -s ${CF_SPACE}
    cf push "composer-playground${PLAYGROUND_SUFFIX}" --docker-image hyperledger/composer-playground:${VERSION} -i 2 -m 128M --no-start
    cf set-env "composer-playground${PLAYGROUND_SUFFIX}" COMPOSER_CONFIG "${WEB_CFG}"
    cf start "composer-playground${PLAYGROUND_SUFFIX}"
    popd
fi


## Stable releases only; both latest and next then clean up git, and bump version number
if [[ "${BUILD_RELEASE}" = "stable" ]]; then

    # Configure the Git repository and clean any untracked and unignored build files.
    git config user.name "${GH_USER_NAME}"
    git config user.email "${GH_USER_EMAIL}"
    git checkout -b master
    git reset --hard
    git clean -d -f

    # Bump the version number.
    npm run pkgbump
    export NEW_VERSION=$(node -e "console.log(require('${DIR}/package.json').version)")

    # Add the version number changes and push them to Git.
    git add .
    git commit -m "Automatic version bump to ${NEW_VERSION}"
    git push origin master

fi


_exit "All complete" 0
