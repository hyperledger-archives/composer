#!/bin/bash

# Exit on first error, print all commands.
set -ev
set -o pipefail
env

# Bring in the standard set of script utilities
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
source ${DIR}/.travis/base.sh

# ----
# Install using pip as apt-get pulls the wrong version on Travis' trusty image
# python requests 2.9.2 is essential prereq for linkchecker

pip install --user linkchecker requests==2.9.2
linkchecker --version
npm install -g lerna@2 @alrra/travis-scripts asciify gnomon

# Abort the fv/integration if this is a merge build
# Check for the FC_TASK that is set in travis.yml, also the pull request is false => merge build
# and that the TRAVIS_TAG is empty meaning this is not a release build
if [ "${FC_TASK}" = "systest" ] && [ "${TRAVIS_PULL_REQUEST}" = "false" ] && [ -z "${TRAVIS_TAG}" ]; then
  if [[ "${TRAVIS_REPO_SLUG}" = hyperledger* ]]; then
    _abortBuild 0
    _exit "Merge build from non release PR: ergo not running fv/integration tests"   
  fi
fi

# Check of the task current executing
if [ "${FC_TASK}" = "docs" ]; then
 _exit "Doing Docs - no requirement for installations of other software" 0
fi

#
cd ${DIR}
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome*.deb
wget -q -O - https://packages.cloudfoundry.org/debian/cli.cloudfoundry.org.key | sudo apt-key add -
echo "deb http://packages.cloudfoundry.org/debian stable main" | sudo tee /etc/apt/sources.list.d/cloudfoundry-cli.list
sudo apt-get update && sudo apt-get install cf-cli

_exit "All Complete" 0