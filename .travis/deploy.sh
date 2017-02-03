#!/bin/bash

# Exit on first error, print all commands.
set -ev
set -o pipefail

# Grab the Concerto directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

# Check that this is the right node.js version.
if [ "${TRAVIS_NODE_VERSION}" != "" -a "${TRAVIS_NODE_VERSION}" != "4" ]; then
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

# Set the NPM access token we will use to publish.
npm config set registry https://registry.npmjs.org/
npm config set //registry.npmjs.org/:_authToken ${NPM_TOKEN}

# Set the GitHub deploy key we will use to publish.
set-up-ssh --key "$encrypted_568b95f14ac3_key" \
           --iv "$encrypted_568b95f14ac3_iv" \
           --path-encrypted-key ".travis/github_deploy_key.enc"

# Change from HTTPS to SSH.
./.travis/fix_github_https_repo.sh

# Push the code to npm.
if [ -z "${TRAVIS_TAG}" ]; then

    # Set the prerelease version.
    npm run pkgstamp

    # Publish with unstable tag. These are development builds.
    echo "Pushing with tag unstable"
    lerna exec --ignore 'composer-systests' -- npm publish --tag=unstable 2>&1 | tee

else

    # Publish with latest tag (default). These are release builds.
    echo "Pushing with tag latest"
    lerna exec --ignore 'composer-systests' -- npm publish 2>&1 | tee

    # Push to public Bluemix.
    pushd ${DIR}/packages/composer-ui/dist
    touch Staticfile
    cf login -a https://api.ng.bluemix.net -u ${CF_USERNAME} -p ${CF_PASSWORD} -o ${CF_ORGANIZATION} -s ${CF_SPACE}
    cf push fabric-composer
    popd

    # Configure the Git repository and clean any untracked and unignored build files.
    git config user.name "Travis CI"
    git config user.email "noreply@travis.ibm.com"
    git checkout -b develop
    git reset --hard
    git clean -d -f

    # Bump the version number.
    npm run pkgbump
    export VERSION=$(node -e "console.log(require('${DIR}/package.json').version)")

    # Add the version number changes and push them to Git.
    git add .
    git commit -m "Automatic version bump to ${VERSION}"
    git push origin develop

fi


# Set the GitHub deploy key we will use to publish.
set-up-ssh --key "$encrypted_f19708b15817_key" \
           --iv "$encrypted_f19708b15817_iv" \
           --path-encrypted-key " ${DIR}/.travis/github_deploy_docs_key.enc"

# push the html documents
# Configure the Git repository and clean any untracked and unignored build files.
git config user.name "Travis CI"
git config user.email "noreply@travis.ibm.com"
git config push.default simple

echo ${DIR}
cd ${DIR}/site/out

export REPO="fabric-composer.github.io"

git clone git@github.com:fabric-composer/${REPO}.git
git remote set-url origin ${REPO}.git

cd ${DIR}/site/out${REPO}

rm -rf ${DIR}/site/out/${REPO}/*
cp -rf ${DIR}/site/out/jekylldocs/_site/* .

git add .

git commit -m "Automated deploy to ${REPO}"
git push
