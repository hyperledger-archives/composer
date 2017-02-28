#!/bin/bash

# Exit on first error, print all commands.
set -ev
set -o pipefail

# Grab the Concerto directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
date
ME=`basename "$0"`

source ${DIR}/build.cfg

if [ "${ABORT_BUILD}" = "true" ]; then
  echo exiting early from ${ME}
  exit ${ABORT_CODE}
fi

# Check that this is the right node.js version.
if [ "${TRAVIS_NODE_VERSION}" != "" -a "${TRAVIS_NODE_VERSION}" != "6" ]; then
    echo Not executing as not running primary node.js version.
    exit 0
fi

# Check that this is not the system tests.
if [ "${SYSTEST}" != "" ]; then
    echo Not executing as running system tests.
    exit 0
fi

# Check that this is the main repository.
if [[ "${TRAVIS_REPO_SLUG}" != fabric-composer* ]]; then
    echo "Skipping deploy; wrong repository slug."
    exit 0
fi

# are we building the docs?
if [ "${DOCS}" != "" ]; then
  ./.travis/deploy_docs.sh
  exit 0
fi


# Set the NPM access token we will use to publish.
npm config set registry https://registry.npmjs.org/
npm config set //registry.npmjs.org/:_authToken ${NPM_TOKEN}

# Set the GitHub deploy key we will use to publish.
set-up-ssh --key "$encrypted_568b95f14ac3_key" \
           --iv "$encrypted_568b95f14ac3_iv" \
           --path-encrypted-key ".travis/github_deploy_key.enc"

# Change from HTTPS to SSH.
./.travis/fix_github_https_repo.sh

# Log in to Docker Hub.
docker login -u="${DOCKER_USERNAME}" -p="${DOCKER_PASSWORD}"

# This is the list of Docker images to build.
export DOCKER_IMAGES=composer-ui

# Push the code to npm.
if [ -z "${TRAVIS_TAG}" ]; then

    # Set the prerelease version.
    npm run pkgstamp
    export VERSION=$(node -e "console.log(require('${DIR}/package.json').version)")

    # Publish with unstable tag. These are development builds.
    echo "Pushing with tag unstable"
    lerna exec --ignore '@(composer-systests|composer-website)' -- npm publish --tag=unstable 2>&1 | tee

    # Build, tag, and publish Docker images.
    for i in ${DOCKER_IMAGES}; do

        # Build the image and tag it with the version and unstable.
        docker build --build-arg VERSION=${VERSION} -t fabriccomposer/${i}:${VERSION} ${DIR}/packages/${i}/docker
        docker tag fabriccomposer/${i}:${VERSION} fabriccomposer/${i}:unstable

        # Push both the version and unstable.
        docker push fabriccomposer/${i}:${VERSION}
        docker push fabriccomposer/${i}:unstable

    done

    # Push to public Bluemix.
    pushd ${DIR}/packages/composer-ui
    cf login -a https://api.ng.bluemix.net -u ${CF_USERNAME} -p ${CF_PASSWORD} -o ${CF_ORGANIZATION} -s ${CF_SPACE}
    cf push fabric-composer-unstable -c "node cli.js" -i 2 -m 256M --no-start
    cf set-env fabric-composer-unstable CLIENT_ID ${GH_UNSTABLE_OAUTH_CLIENT_ID}
    cf set-env fabric-composer-unstable CLIENT_SECRET ${GH_UNSTABLE_OAUTH_CLIENT_SECRET}
    cf start fabric-composer-unstable
    popd

else

    # Grab the current version.
    export VERSION=$(node -e "console.log(require('${DIR}/package.json').version)")

    # Publish with latest tag (default). These are release builds.
    echo "Pushing with tag latest"
    lerna exec --ignore '@(composer-systests|composer-website)' -- npm publish 2>&1 | tee

    # Build, tag, and publish Docker images.
    for i in ${DOCKER_IMAGES}; do

        # Build the image and tag it with the version and latest.
        docker build --build-arg VERSION=${VERSION} -t fabriccomposer/${i}:${VERSION} ${DIR}/packages/${i}/docker
        docker tag fabriccomposer/${i}:${VERSION} fabriccomposer/${i}:latest

        # Push both the version and latest.
        docker push fabriccomposer/${i}:${VERSION}
        docker push fabriccomposer/${i}:latest

    done

    # Push to public Bluemix.
    pushd ${DIR}/packages/composer-ui
    cf login -a https://api.ng.bluemix.net -u ${CF_USERNAME} -p ${CF_PASSWORD} -o ${CF_ORGANIZATION} -s ${CF_SPACE}
    cf push fabric-composer -c "node cli.js" -i 2 -m 256M --no-start
    cf set-env fabric-composer CLIENT_ID ${GH_OAUTH_CLIENT_ID}
    cf set-env fabric-composer CLIENT_SECRET ${GH_OAUTH_CLIENT_SECRET}
    cf start fabric-composer
    popd

    # Configure the Git repository and clean any untracked and unignored build files.
    git config user.name "Travis CI"
    git config user.email "noreply@travis.ibm.com"
    git checkout -b develop
    git reset --hard
    git clean -d -f

    # Bump the version number.
    npm run pkgbump
    export NEW_VERSION=$(node -e "console.log(require('${DIR}/package.json').version)")

    # Add the version number changes and push them to Git.
    git add .
    git commit -m "Automatic version bump to ${NEW_VERSION}"
    git push origin develop

fi
date
