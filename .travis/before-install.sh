#!/bin/bash

# Exit on first error, print all commands.
set -ev
set -o pipefail

# Grab the parent (root) directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

npm install -g npm@4
npm install -g @alrra/travis-scripts

echo "ABORT_BUILD=false" > ${DIR}/build.cfg
echo "ABORT_CODE=0" >> ${DIR}/build.cfg

if [ "${SYSTEST}" = "hlf" ] && [ "${SYSTEST_HLF}" = "ibm" ]; then

  if [ "${TRAVIS_EVENT_TYPE}" = "cron" ]; then
  	echo Valid to run hlf with ibm systest as CRON build
  else
    echo "ABORT_BUILD=true" > ${DIR}/build.cfg
    echo "ABORT_CODE=0" >> ${DIR}/build.cfg
    echo Not running as a PR or merge build
    exit 0
  fi
fi

# Abort the systest if this is a merge build
# Check for the FC_TASK that is set in travis.yml, also the pull request is false => merge build
# and that the TRAVIS_TAG is empty meaning this is not a release build
if [ "${FC_TASK}" = "systest" ] && [ "${TRAVIS_PULL_REQUEST}" = "false" ] && [ -z "${TRAVIS_TAG}" ]; then
  echo "ABORT_BUILD=true" > ${DIR}/build.cfg
  echo "ABORT_CODE=0" >> ${DIR}/build.cfg
  echo Merge build from non release PR: ergo not running systest
  exit 0
fi

#
echo "->- Build cfg being used"
cat ${DIR}/build.cfg
echo "-<-"

# Check of the task current executing
if [ "${FC_TASK}" = "docs" ]; then
  echo Doing Docs - no requirement for installations of other software
  exit 0;
fi

#
cd ${DIR}

wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome*.deb
wget -q -O - https://packages.cloudfoundry.org/debian/cli.cloudfoundry.org.key | sudo apt-key add -
echo "deb http://packages.cloudfoundry.org/debian stable main" | sudo tee /etc/apt/sources.list.d/cloudfoundry-cli.list
sudo apt-get update && sudo apt-get install cf-cli
