#!/bin/bash

# Exit on first error, print all commands.
set -ev
set -o pipefail

# Grab the parent (root) directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
date
ME=`basename "$0"`

echo "=== Starting the deploy script"

source ${DIR}/build.cfg

if [ "${ABORT_BUILD}" = "true" ]; then
  echo exiting early from ${ME}
  exit ${ABORT_CODE}
fi

# Check that this is the right node.js version.
if [ "${TRAVIS_NODE_VERSION}" != "" -a "${TRAVIS_NODE_VERSION}" != "8" ]; then
    echo Not executing as not running primary node.js version.
    exit 0
fi

# Check that this is not the functional verification tests.
if [ "${FVTEST}" != "" ]; then
    echo Not executing as running fv tests.
    exit 0
fi

# Check that this is not the integration tests.
if [ "${INTEST}" != "" ]; then
    echo Not executing as running integration tests.
    exit 0
fi

# Check that this is the main repository.
if [[ "${TRAVIS_REPO_SLUG}" != hyperledger* ]]; then
    echo "Skipping deploy; wrong repository slug."
    exit 0
fi

# Check that if this is not a tagged build and not master or the stable v0.16.x
if [ "${TRAVIS_TAG}" = "" ]; then
  if [ "${TRAVIS_BRANCH}" != "master" -a "${TRAVIS_BRANCH}" != "v0.16.x" ]; then
    echo Not executing as not building a tag
    exit 0
  fi  
fi

# are we building the docs?
if [ "${DOCS}" != "" ]; then
  if [ -z "${TRAVIS_TAG}" ]; then
    DOCS="unstable"
  else
    if [ "${TRAVIS_BRANCH}" = "master" ]; then
        DOCS="latest"
    elif [[ "${TRAVIS_BRANCH}" =~ v0\.16\.[0-9]{1,2} ]]; then
        DOCS="stable"
    fi
  fi
  ./.travis/deploy_docs.sh
  exit 0
fi


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

# This is the list of Docker images to build.
export DOCKER_IMAGES="composer-playground composer-rest-server composer-cli"

# Push the code to npm.
if [ -z "${TRAVIS_TAG}" ]; then

    # Set the prerelease version.
    npm run pkgstamp
    export VERSION=$(node -e "console.log(require('${DIR}/package.json').version)")

    # Publish with unstable tag. These are development builds.
    echo "Pushing with tag unstable"
    lerna exec --ignore '@(composer-tests-integration|composer-tests-functional|composer-website)' -- npm publish --tag=unstable 2>&1

	# quick check to see if the latest npm module has been published
	while ! npm view composer-playground@${VERSION} | grep dist-tags > /dev/null 2>&1; do
	  sleep 10
	done

    # Build, tag, and publish Docker images.
    for i in ${DOCKER_IMAGES}; do

        # Build the image and tag it with the version and unstable.
        docker build --build-arg VERSION=${VERSION} -t hyperledger/${i}:${VERSION} ${DIR}/packages/${i}/docker
        docker tag hyperledger/${i}:${VERSION} hyperledger/${i}:unstable

        # Push both the version and unstable.
        docker push hyperledger/${i}:${VERSION}
        docker push hyperledger/${i}:unstable

    done

    # Push to public Bluemix.
    pushd ${DIR}/packages/composer-playground
    cf login -a https://api.ng.bluemix.net -u ${CF_USERNAME} -p ${CF_PASSWORD} -o ${CF_ORGANIZATION} -s ${CF_SPACE}
    cf push composer-playground-unstable -c "node cli.js" -i 2 -m 128M --no-start
    cf set-env composer-playground-unstable CLIENT_ID ${GH_NEXT_UNSTABLE_OAUTH_CLIENT_ID}
    cf set-env composer-playground-unstable CLIENT_SECRET ${GH_NEXT_UNSTABLE_OAUTH_CLIENT_SECRET}
    cf set-env composer-playground-unstable COMPOSER_CONFIG '{"webonly":true}'
    cf start composer-playground-unstable
    popd

else

    # Grab the current version.
    export VERSION=$(node -e "console.log(require('${DIR}/package.json').version)")
    
    # process travis environment variables
    if [ "${TRAVIS_BRANCH}" = "master" ]; then
        PLAYGROUND_SUFFIX="-latest"      
        WEB_CFG="'{\"webonly\":true,  \"analyticsID\" : \"UA-91314349-4\"}'"
    elif [[ "${TRAVIS_BRANCH}" =~ v0\.16\.[0-9]{1,2} ]]; then
        PLAYGROUND_SUFFIX=""
        WEB_CFG="'{\"webonly\":true,  \"analyticsID\" : \"UA-91314349-3\"}'"      
    else 
        echo "Unkown travis branch"
        echo ${TRAVIS_BRANCH}
        exit 1    
    fi

    # Publish with latest tag (default). These are release builds.
    echo "Pushing with tag latest"
    lerna exec --ignore '@(composer-tests-integration|composer-tests-functional|composer-website)' -- npm publish 2>&1

	# quick check to see if the latest npm module has been published
	while ! npm view composer-playground@${VERSION} | grep dist-tags > /dev/null 2>&1; do
	  sleep 10
	done

    # Build, tag, and publish Docker images.
    for i in ${DOCKER_IMAGES}; do

        # Build the image and tag it with the version and latest.
        docker build --build-arg VERSION=${VERSION} -t hyperledger/${i}:${VERSION} ${DIR}/packages/${i}/docker
        docker tag hyperledger/${i}:${VERSION} hyperledger/${i}:latest

        # Push both the version and latest.
        docker push hyperledger/${i}:${VERSION}
        docker push hyperledger/${i}:latest

    done

    # Push to public Bluemix.
    pushd ${DIR}/packages/composer-playground
    cf login -a https://api.ng.bluemix.net -u ${CF_USERNAME} -p ${CF_PASSWORD} -o ${CF_ORGANIZATION} -s ${CF_SPACE}
    cf push composer-playground${PLAYGROUND_SUFFIX} -c "node cli.js" -i 2 -m 128M --no-start
    cf set-env composer-playground${PLAYGROUND_SUFFIX} CLIENT_ID ${GH_NEXT_OAUTH_CLIENT_ID}
    cf set-env composer-playground${PLAYGROUND_SUFFIX} CLIENT_SECRET ${GH_NEXT_OAUTH_CLIENT_SECRET}
    cf set-env composer-playground${PLAYGROUND_SUFFIX} COMPOSER_CONFIG ${WEB_CFG}
    cf start composer-playground${PLAYGROUND_SUFFIX} 
    popd


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
date
