#!/bin/bash

# Exit on first error, print all commands.
set -ev
set -o pipefail

# Grab the  directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
date
# Set the GitHub deploy key we will use to publish.
set-up-ssh --key "$encrypted_f19708b15817_key" \
           --iv "$encrypted_f19708b15817_iv" \
           --path-encrypted-key ".travis/github_deploy_docs_key.enc"

# push the html documents
# Configure the Git repository and clean any untracked and unignored build files.
git config user.name "Travis CI"
git config user.email "noreply@travis.ibm.com"
git config push.default simple

echo ${DIR}
cd "${DIR}/packages/composer-website/out"

export REPO="fabric-composer.github.io"

git clone git@github.com:fabric-composer/${REPO}.git
git remote set-url origin ${REPO}.git

cd "${DIR}/packages/composer-website/out/${REPO}"

rm -rf ${DIR}/packages/composer-website/out/${REPO}/*
cp -rf ${DIR}/packages/composer-website/jekylldocs/_site/* .

git add .

git commit -m "Automated deploy to ${REPO}"
git push
date
