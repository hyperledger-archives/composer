#!/bin/bash

# Exit on first error, print all commands.
set -ev

# Grab the Concerto directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

# Pull and tag the latest Hyperledger Fabric images.
if [ "${TEST_SUITE}" = "" -o "${TEST_SUITE}" = "system_hlf" ]; then
    DOCKER_FILE=${DIR}/systest/docker-compose.yml
    docker pull hyperledger/fabric-membersrvc:x86_64-0.6.1-preview
    docker tag hyperledger/fabric-membersrvc:x86_64-0.6.1-preview hyperledger/fabric-membersrvc:latest
    docker pull hyperledger/fabric-peer:x86_64-0.6.1-preview
    docker tag hyperledger/fabric-peer:x86_64-0.6.1-preview hyperledger/fabric-peer:latest
    docker pull hyperledger/fabric-baseimage:x86_64-0.2.0
    docker tag hyperledger/fabric-baseimage:x86_64-0.2.0 hyperledger/fabric-baseimage:latest
elif [ "${TEST_SUITE}" = "system_ibm" ]; then
    DOCKER_FILE=${DIR}/systest/ibm-docker-compose.yml
    docker pull ibmblockchain/fabric-membersrvc:x86_64-0.6.1-preview
    docker tag ibmblockchain/fabric-membersrvc:x86_64-0.6.1-preview ibmblockchain/fabric-membersrvc:latest
    docker pull ibmblockchain/fabric-peer:x86_64-0.6.1-preview
    docker tag ibmblockchain/fabric-peer:x86_64-0.6.1-preview ibmblockchain/fabric-peer:latest
    docker pull hyperledger/fabric-baseimage:x86_64-0.2.0
    docker tag hyperledger/fabric-baseimage:x86_64-0.2.0 hyperledger/fabric-baseimage:latest
else
    echo Cannot determine how to execute the tests for this test suite: ${TEST_SUITE}
    exit 1
fi

# Shut down the Docker containers for the system tests.
cd ${DIR}/systest
docker-compose -f ${DOCKER_FILE} kill && docker-compose -f ${DOCKER_FILE} down

# Start up the Docker containers for the system tests.
docker-compose -f ${DOCKER_FILE} build

# Run the system tests.
if [ "${TRAVIS}" = "true" ]; then
    docker-compose -f ${DOCKER_FILE} run -e CONCERTO_PORT_WAIT_SECS=30 -e CONCERTO_DEPLOY_WAIT_SECS=120 --rm concerto npm run systest
else
    docker-compose -f ${DOCKER_FILE} run --rm concerto npm run systest
fi

# Shut down the Docker containers for the system tests.
docker-compose -f ${DOCKER_FILE} kill && docker-compose -f ${DOCKER_FILE} down
