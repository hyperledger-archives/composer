#!/bin/bash
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# 
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

# Exit on first error, print all commands.
set -ev
set -o pipefail
env

# Workaround for the mongodb cert expiry
sudo rm /etc/apt/sources.list.d/mongodb-3.4.list  || echo "ok if does not exist"

# We don't need no steenkin PHP
sudo rm -rf ~/.phpenv || true

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
    _exit "Merge build from non release PR: ergo not running fv/integration tests" 0
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

# install softhsm
mkdir softhsm
cd softhsm
curl -O https://dist.opendnssec.org/source/softhsm-2.0.0.tar.gz
tar -xvf softhsm-2.0.0.tar.gz
cd softhsm-2.0.0
./configure --disable-non-paged-memory --disable-gost
make
sudo make install

# now configure slot 0 with pin
sudo mkdir -p /var/lib/softhsm/tokens
sudo chmod 777 /var/lib/softhsm/tokens
softhsm2-util --init-token --slot 0 --label "ForComposer" --so-pin 1234 --pin 98765432

_exit "All Complete" 0