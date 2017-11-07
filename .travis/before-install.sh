#!/bin/bash

# Exit on first error, print all commands.
set -ev
set -o pipefail

# Remove the MongoDB repo as their GPG key has expired.
sudo rm /etc/apt/sources.list.d/mongodb-3.2.list
# Remove Riak https://github.com/travis-ci/travis-ci/issues/8607
sudo rm -vf /etc/apt/sources.list.d/*riak*

# Install using pip as apt-get pulls the wrong version on Travis' trusty image
# python requests 2.9.2 is essential prereq for linkchecker

pip install --user linkchecker requests==2.9.2
linkchecker --version

# Grab the parent (root) directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

npm install -g lerna@2 @alrra/travis-scripts asciify gnomon


echo "ABORT_BUILD=false" > ${DIR}/build.cfg
echo "ABORT_CODE=0" >> ${DIR}/build.cfg

# Abort the systest if this is a merge build
# Check for the FC_TASK that is set in travis.yml, also the pull request is false => merge build
# and that the TRAVIS_TAG is empty meaning this is not a release build
if [ "${FC_TASK}" = "systest" ] && [ "${TRAVIS_PULL_REQUEST}" = "false" ] && [ -z "${TRAVIS_TAG}" ]; then
  if [[ "${TRAVIS_REPO_SLUG}" = hyperledger* ]]; then
    echo "ABORT_BUILD=true" > ${DIR}/build.cfg
    echo "ABORT_CODE=0" >> ${DIR}/build.cfg
    echo Merge build from non release PR: ergo not running systest
    exit 0
  fi
fi

#
echo "->- Build cfg being used"
cat ${DIR}/build.cfg
echo "-<-"


######
# checking the changes that are in this file
echo "Travis commit range $TRAVIS_COMMIT_RANGE"
echo "Travis commit $TRAVIS_COMMIT"
echo "Travis event type $TRAVIS_EVENT_TYPE"


if [ "$TRAVIS_PULL_REQUEST" != "false" ]; then
  echo -e "Build Pull Request #$TRAVIS_PULL_REQUEST => Branch [$TRAVIS_BRANCH]"
elif [ "$TRAVIS_PULL_REQUEST" == "false" ] && [ "$TRAVIS_TAG" == "" ]; then
  echo -e 'Build Branch with Snapshot => Branch ['$TRAVIS_BRANCH']'
elif [ "$TRAVIS_PULL_REQUEST" == "false" ] && [ "$TRAVIS_TAG" != "" ]; then
  echo -e 'Build Branch for Release => Branch ['$TRAVIS_BRANCH']  Tag ['$TRAVIS_TAG']'
else
  echo -e 'WARN: Should not be here => Branch ['$TRAVIS_BRANCH']  Tag ['$TRAVIS_TAG']  Pull Request ['$TRAVIS_PULL_REQUEST']'
fi


cd $TRAVIS_BUILD_DIR
touch changefiles.log
git diff --name-only $(echo $TRAVIS_COMMIT_RANGE | sed 's/\.//')

if [ "$TRAVIS_PULL_REQUEST" = "false" ]; then
    git show --pretty=format: --name-only "$TRAVIS_COMMIT_RANGE"|sort|uniq  >> changedfiles.log  || echo Fail
elif [ -n "$TRAVIS_PULL_REQUEST" ]; then
    git diff --name-only "$TRAVIS_COMMIT" "$TRAVIS_BRANCH"  >> changedfiles.log   || echo Fail
fi

RESULT=$(cat changedfiles.log | sed '/^\s*$/d' | awk '!/composer-website/ { print "MORE" }')
if [ "${RESULT}" == "" ] && [ "$TRAVIS_TAG" == "" ];
then

    # Check of the task current executing
    if [ "${FC_TASK}" != "docs" ]; then
#        echo "ABORT_BUILD=true" > ${DIR}/build.cfg
#        echo "ABORT_CODE=0" >> ${DIR}/build.cfg
        echo 'Docs only build'
#        exit 0
    fi

else
  echo "More than docs changes"
fi
rm changedfiles.log
cd - > /dev/null
######




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
