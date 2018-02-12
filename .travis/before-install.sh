#!/bin/bash

# Exit on first error, print all commands.
set -ev
set -o pipefail

# Grab the parent (root) directory. Define ME, and the exit fn
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
ME=`basename "$0"`
echo "-->-- Starting ${ME}"
function _exit(){
    printf "%s Exiting %s because %s exit code:%s\n" "--<--" "${ME}" "$1" "$2"   
    exit $2
}


# Ensure we're using the correct fork of go-duktape.
pushd "${DIR}/packages/composer-runtime-hlfv1/vendor/gopkg.in/olebedev/go-duktape.v3"
if ! git remote -v | grep sstone1 > /dev/null; then
    echo Using the wrong version of go-duktape: refusing to run the build
    exit 1
fi
popd

# Remove the MongoDB repo as their GPG key has expired.
sudo rm /etc/apt/sources.list.d/mongodb-3.2.list  || echo "Not an issue any more"
# Remove Riak https://github.com/travis-ci/travis-ci/issues/8607
sudo rm -vf /etc/apt/sources.list.d/*riak*  || echo "Not an issue any more"

# Install using pip as apt-get pulls the wrong version on Travis' trusty image
# python requests 2.9.2 is essential prereq for linkchecker

pip install --user linkchecker requests==2.9.2
linkchecker --version

npm install -g lerna@2 @alrra/travis-scripts asciify gnomon

echo "ABORT_BUILD=false" > ${DIR}/build.cfg
echo "ABORT_CODE=0" >> ${DIR}/build.cfg

# Abort the fv/integration if this is a merge build
# Check for the FC_TASK that is set in travis.yml, also the pull request is false => merge build
# and that the TRAVIS_TAG is empty meaning this is not a release build
if [ "${FC_TASK}" = "systest" ] && [ "${TRAVIS_PULL_REQUEST}" = "false" ] && [ -z "${TRAVIS_TAG}" ]; then
  if [[ "${TRAVIS_REPO_SLUG}" = hyperledger* ]]; then
    echo "ABORT_BUILD=true" > ${DIR}/build.cfg
    echo "ABORT_CODE=0" >> ${DIR}/build.cfg
    echo Merge build from non release PR: ergo not running fv/integration tests
    exit 0
  fi
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

_exit "All complete" 0