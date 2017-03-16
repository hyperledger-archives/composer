#!/bin/bash

# Exit on first error, print all commands.
set -ev
set -o pipefail

# Grab the  directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
date
# Set the GitHub deploy key we will use to publish.
set-up-ssh --key "$encrypted_8496d53a6fac_key" \
           --iv "$encrypted_8496d53a6fac_iv" \
           --path-encrypted-key ".travis/github_deploy_key.enc"

# push the html documents
# Configure the Git repository and clean any untracked and unignored build files.
git config user.name "${GH_USER_NAME}"
git config user.email "${GH_USER_EMAIL}"
git config push.default simple

echo ${DIR}
cd "${DIR}/packages/composer-website/out"

export REPO="fabric-composer.github.io"

git clone git@github.com:fabric-composer/${REPO}.git
git remote set-url origin ${REPO}.git

cd "${DIR}/packages/composer-website/out/${REPO}"

if [ "${DOCS}" == "full" ]; then
    rm -rf ${DIR}/packages/composer-website/out/${REPO}/*
    cp -rf ${DIR}/packages/composer-website/jekylldocs/_site/* .
fi

mkdir -p ${DIR}/packages/composer-website/out/${REPO}/unstable
rm -rf ${DIR}/packages/composer-website/out/${REPO}/unstable/*
cp -rf ${DIR}/packages/composer-website/jekylldocs/_site/* ./unstable

git add .

git commit -m "Automated deploy to ${REPO}"
git push
date
