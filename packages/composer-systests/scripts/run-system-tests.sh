#!/bin/bash

# Exit on first error, print all commands.
set -ev
set -o pipefail

# Grab the Concerto directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

# Switch into the system tests directory.
cd "${DIR}"

# Barf if we don't recognize this test suite.
if [ "${SYSTEST}" = "" ]; then
    echo You must set SYSTEST to 'embedded', 'web', or 'hlf'
    echo For example:
    echo  export SYSTEST=hlf
    exit 1
fi

# Set default timeouts
export CONCERTO_PORT_WAIT_SECS=30
export CONCERTO_DEPLOY_WAIT_SECS=120

# Pull any required Docker images.
if [ "${SYSTEST}" = "hlf" -a "${SYSTEST_HLF}" = "hlf" ]; then
    DOCKER_FILE=${DIR}/hlf-docker-compose.yml
    docker pull hyperledger/fabric-membersrvc:x86_64-0.6.1-preview
    docker tag hyperledger/fabric-membersrvc:x86_64-0.6.1-preview hyperledger/fabric-membersrvc:latest
    docker pull hyperledger/fabric-peer:x86_64-0.6.1-preview
    docker tag hyperledger/fabric-peer:x86_64-0.6.1-preview hyperledger/fabric-peer:latest
    docker pull hyperledger/fabric-baseimage:x86_64-0.2.0
    docker tag hyperledger/fabric-baseimage:x86_64-0.2.0 hyperledger/fabric-baseimage:latest
elif [ "${SYSTEST}" = "hlf" ] && [ "${SYSTEST_HLF}" = "ibm" ]; then

  if [ "${TRAVIS_EVENT_TYPE}" = "cron" ]; then
    DOCKER_FILE=${DIR}/ibm-docker-compose.yml
    docker pull ibmblockchain/fabric-membersrvc:x86_64-0.6.1-preview
    docker tag ibmblockchain/fabric-membersrvc:x86_64-0.6.1-preview ibmblockchain/fabric-membersrvc:latest
    docker pull ibmblockchain/fabric-peer:x86_64-0.6.1-preview
    docker tag ibmblockchain/fabric-peer:x86_64-0.6.1-preview ibmblockchain/fabric-peer:latest
    docker pull hyperledger/fabric-baseimage:x86_64-0.2.0
    docker tag hyperledger/fabric-baseimage:x86_64-0.2.0 hyperledger/fabric-baseimage:latest
  else
    echo Not running as a PR or merge build
    exit 0
  fi
elif [ "${SYSTEST}" = "hlf" -a "${SYSTEST_HLF}" = "" ]; then
    echo You must set SYSTEST_HLF to 'hlf' or 'ibm'
    echo For example:
    echo     export SYSTEST_HLF=hlf
    exit 1
fi

# Start any required Docker images.
if [ "${DOCKER_FILE}" != "" ]; then
    docker-compose -f ${DOCKER_FILE} kill
    docker-compose -f ${DOCKER_FILE} down
    docker-compose -f ${DOCKER_FILE} up -d
fi

# Delete any existing configuration.
rm -rf ${HOME}/.composer-connection-profiles/concerto-systests
rm -rf ${HOME}/.concerto-credentials/concerto-systests

# Run the system tests.
npm run systest:${SYSTEST} 2>&1 | tee

# Kill and remove any started Docker images.
if [ "${DOCKER_FILE}" != "" ]; then
    docker-compose -f ${DOCKER_FILE} kill
    docker-compose -f ${DOCKER_FILE} down
fi

# Delete any written configuration.
rm -rf ${HOME}/.composer-connection-profiles/concerto-systests
rm -rf ${HOME}/.concerto-credentials/concerto-systests

# Run getting started system test
#sh $DIR/scripts/getting-started.sh $DIR
