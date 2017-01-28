#!/bin/bash

# Exit on first error, print all commands.

set -ev

# Grab the Concerto-Docs directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"


## Copy the latest source MD docs in 'develop/docs' to their respective
## directories under 'develop/jekylldocs'

export TODIR=${DIR}/out

rm -rf ${TODIR}/jekylldocs/
mkdir -p ${TODIR}/jekylldocs

# Copy the new files into a working dir, ie the source docs, and generated diagrams. Prior to jekyll build.
cp -rf ${DIR}/jekylldocs ${TODIR}

for dirname in overview start concepts tasks reference support
do
  cp -pr ${DIR}/docs/${dirname}/ ${TODIR}/jekylldocs/${dirname}/
done

#copy latest images to jekylldocs
cp -pr ${DIR}/docs/images/ ${TODIR}/jekylldocs/images

#copy latest images to jekylldocs
rm -rf ${TODIR}/jekylldocs/jsdoc/develop
mkdir -p ${TODIR}/jekylldocs/jsdoc/develop
cp -pr ${DIR}/out/public/* ${TODIR}/jekylldocs/jsdoc/develop
cp -pr ${DIR}/out/diagrams   ${TODIR}/jekylldocs/jsdoc/develop

cd ${TODIR}/jekylldocs


echo "About to build"
echo ${TRAVIS_REPO_SLUG}

if [ "${TRAVIS_REPO_SLUG}" == "Blockchain-WW-Labs/Concerto-Docs" ]; then #replace slug with Blockchain-WW-Labs
    echo "Main build"
    jekyll build
else
    echo "User build"
    jekyll build --baseurl /${TRAVIS_REPO_SLUG}
fi

pwd
