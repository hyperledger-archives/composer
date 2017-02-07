#!/bin/bash

# Exit on first error, print all commands.
set -ev
set -o pipefail

# Grab the  directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

if [ "${TRAVIS_PULL_REQUEST}" == "false" ]; then # do the full normal push
    echo "Not deploying to staging area - merge request"
    exit 0
fi

# Set the GitHub deploy key we will use to publish.
set-up-ssh --key "$encrypted_4664aa7e5e58_key" \
           --iv "$encrypted_4664aa7e5e58_iv" \
           --path-encrypted-key ".travis/github_deploy_staging_docs_key.enc"

# push the html documents
# Configure the Git repository and clean any untracked and unignored build files.
git config user.name "Travis CI"
git config user.email "noreply@travis.ibm.com"
git config push.default simple

echo ${DIR}
cd ${DIR}/site/out/

export REPO="staging-fabric-composer-web"

git clone git@github.com:fabric-composer/${REPO}.git
git remote set-url origin ${REPO}.git

# do some clean up of all files older than a day
find ${DIR}/site/out/* -mtime +1 -exec rm -rf {} \;

mkdir ${REPO}/${TRAVIS_PULL_REQUEST}
cd ${DIR}/site/out/${REPO}/${TRAVIS_PULL_REQUEST}

#rm -rf ${DIR}/site/out/${REPO}/*
cp -rf ${DIR}/site/out/jekylldocs/_site/* .
cd ${DIR}/site/out/
git add .

git commit -m "Automated deploy to ${REPO}"
git push
