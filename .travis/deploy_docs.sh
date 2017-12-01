#!/bin/bash

# Exit on first error, print all commands.
set -ev
set -o pipefail

# Grab the parent (root) directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
date
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

# Should be able to copy all the docs as needed
mkdir -p ${TODIR}/${DOCS}
rm -rf ${TODIR}/${DOCS}/*
cp -rf ${DIR}/packages/composer-website/jekylldocs/_site/* ${TODIR}/${DOCS}/

echo "<meta http-equiv=\"refresh\" content=\"0; url=stable/index.html\" />" > ${TODIR}/index.html

# If this is a full docs build, copy the docs into the GitHub repository as the main website.
#if [ "${DOCS}" == "stable" ]; then
#    rm -rf ${TODIR}/*
#    cp -rf ${DIR}/packages/composer-website/jekylldocs/_site/* ${TODIR}/stable
#fi

# Always copy the docs into the GitHub repository as the unstable website.
#mkdir -p ${TODIR}/unstable
#rm -rf ${TODIR}/unstable/*
#cp -rf ${DIR}/packages/composer-website/jekylldocs/_site/* ${TODIR}/unstable/

# Add all the changes, commit, and push to the GitHub repository.
cd ${TODIR}
git add .
git commit -m "Automatic deployment of website"
git push origin gh-pages
date
