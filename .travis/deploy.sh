#!/bin/bash

# Exit on first error, print all commands.
set -ev
set -o pipefail

# Grab the parent (root) directory. Define ME, and the exit fn
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

# Check that this is the right node.js version.
if [ "${TRAVIS_NODE_VERSION}" != "" -a "${TRAVIS_NODE_VERSION}" != "8" ]; then
    _exit "Not executing as not running primary node.js version." 0
fi

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

# Check that if this is stable v0.16.x
if [ "${TRAVIS_TAG}" = "" ]; then
  if [ "${TRAVIS_BRANCH}" != "v0.16.x" ]; then
    echo Not executing as not building a tag
    exit 0
  fi  
fi

# are we building the docs?
if [ "${DOCS}" != "" ]; then
  ./.travis/deploy_docs.sh
  _exit "Run the docs build" $?
fi

## Normal release process here

# Set the NPM access token we will use to publish.
npm config set registry https://registry.npmjs.org/
npm config set //registry.npmjs.org/:_authToken ${NPM_TOKEN}

# Set the GitHub deploy key we will use to publish.
set-up-ssh --key "$encrypted_17b59ce72ad7_key" \
           --iv "$encrypted_17b59ce72ad7_iv" \
           --path-encrypted-key ".travis/github_deploy_key.enc"

# Change from HTTPS to SSH.
./.travis/fix_github_https_repo.sh

# Test the GitHub deploy key.
git ls-remote

# Log in to Docker Hub.
docker login -u="${DOCKER_USERNAME}" -p="${DOCKER_PASSWORD}"

# This is the list of npm modules required by docker images
export NPM_MODULES="composer-admin composer-client composer-cli composer-common composer-playground composer-playground-api composer-rest-server loopback-connector-composer"

# This is the list of Docker images to build.
export DOCKER_IMAGES="composer-playground composer-rest-server composer-cli"

# Push the code to npm.
if [[ "${BUILD_RELEASE}" == "unstable" ]]; then

    # Set the prerelease version.
    npm run pkgstamp
    export VERSION=$(node -e "console.log(require('${DIR}/package.json').version)")
    WEB_CFG="{\"webonly\":true}"
    TAG="unstable"

    # Publish with unstable tag. These are development builds.
    echo "Pushing with tag ${TAG}"
    lerna exec --ignore '@(composer-tests-integration|composer-tests-functional|composer-website)' -- npm publish --tag="${TAG}" 2>&1

    # Check that all required modules have been published to npm and are retrievable
    for j in ${NPM_MODULES}; do
        # check the next in the list
        while ! npm view ${j}@${VERSION} | grep dist-tags > /dev/null 2>&1; do
            sleep 10
        done
    done

    # Build, tag, and publish Docker images.
    for i in ${DOCKER_IMAGES}; do

        # Build the image and tag it with the version and unstable.
        docker build --build-arg VERSION=${VERSION} -t hyperledger/${i}:${VERSION} ${DIR}/packages/${i}/docker
        docker tag hyperledger/${i}:${VERSION} hyperledger/${i}:"${TAG}"

        # Push both the version and unstable.
        docker push hyperledger/${i}:${VERSION}
        docker push hyperledger/${i}:${TAG}

    done

elif [[ "${BUILD_RELEASE}" = "stable" ]]; then

    # Grab the current version.
    export VERSION=$(node -e "console.log(require('${DIR}/package.json').version)")
    
    WEB_CFG="{\"webonly\":true,\"analyticsID\":\"UA-91314349-4\"}"
    TAG="v0.16"

    # Publish with latest tag (default). These are release builds.
    echo "Pushing with tag ${TAG}"
    lerna exec --ignore '@(composer-tests-integration|composer-tests-functional|composer-website)' -- npm publish --tag="${TAG}" 2>&1

    # Check that all required modules have been published to npm and are retrievable
    for j in ${NPM_MODULES}; do
        # check the next in the list
        while ! npm view ${j}@${VERSION} | grep dist-tags > /dev/null 2>&1; do
            sleep 10
        done
    done

    # Build, tag, and publish Docker images.
    for i in ${DOCKER_IMAGES}; do

        # Build the image and tag it with the version and latest.
        docker build --build-arg VERSION=${VERSION} -t hyperledger/${i}:${VERSION} ${DIR}/packages/${i}/docker
        docker tag hyperledger/${i}:${VERSION} hyperledger/${i}:${TAG}

        # Push both the version and latest.
        docker push hyperledger/${i}:${VERSION}
        docker push hyperledger/${i}:${TAG}

    done

    # Configure the Git repository and clean any untracked and unignored build files.
    git config user.name "${GH_USER_NAME}"
    git config user.email "${GH_USER_EMAIL}"
    git checkout -b v0.16.x
    git reset --hard
    git clean -d -f

    # Bump the version number.
    npm run pkgbump
    export NEW_VERSION=$(node -e "console.log(require('${DIR}/package.json').version)")

    # Add the version number changes and push them to Git.
    git add .
    git commit -m "Automatic version bump to ${NEW_VERSION}"
    git push origin v0.16.x

else
   _exit "Unkown build release or focus ${BUILD_RELEASE}" 1
fi


_exit "All complete" 0
