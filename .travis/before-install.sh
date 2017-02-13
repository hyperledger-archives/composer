#!/bin/bash

# Exit on first error, print all commands.
set -ev
set -o pipefail

# Grab the Concerto directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"


if [ "${SYSTEST}" = "hlf" ] && [ "${SYSTEST_HLF}" = "ibm" ]; then

  if [ "${TRAVIS_EVENT_TYPE}" = "cron" ]; then
	echo Valid to run hlf with ibm systest as CRON build
  else
    export ABORT_BUILD=true
    export ABORT_CODE=0
    echo Not running as a PR or merge build
    exit 0
  fi
fi

cd ${DIR}
npm install -g npm
npm install -g @alrra/travis-scripts
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome*.deb
wget -q -O - https://packages.cloudfoundry.org/debian/cli.cloudfoundry.org.key | sudo apt-key add -
echo "deb http://packages.cloudfoundry.org/debian stable main" | sudo tee /etc/apt/sources.list.d/cloudfoundry-cli.list
sudo apt-get update && sudo apt-get install cf-cli
