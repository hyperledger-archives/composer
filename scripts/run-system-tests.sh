#!/bin/bash

# Exit on first error, print all commands.
set -ev

# Grab the Concerto directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

# Barf if we don't recognize this test suite.
if [ "${TEST_SUITE}" = "" ]; then
    echo You must specify which test suite to execute
    exit 1
fi

# Check which test suite to run.
case ${TEST_SUITE} in
systest_web)

    # Run the system tests.
    cd ${DIR}
    npm run systestweb
    ;;

systest_hlf|systest_ibm)

    # Check to see if NPM_TOKEN is valid.
    if [ "${NPM_TOKEN}" = "" ]; then
        echo Cannot proceed unless NPM_TOKEN has been set in the environment
        exit 1
    fi

    # Pull and tag the latest Hyperledger Fabric images.
    if [ "${TEST_SUITE}" = "systest_hlf" ]; then
        DOCKER_FILE=${DIR}/hlf-docker-compose.yml
        docker pull hyperledger/fabric-membersrvc:x86_64-0.6.1-preview
        docker tag hyperledger/fabric-membersrvc:x86_64-0.6.1-preview hyperledger/fabric-membersrvc:latest
        docker pull hyperledger/fabric-peer:x86_64-0.6.1-preview
        docker tag hyperledger/fabric-peer:x86_64-0.6.1-preview hyperledger/fabric-peer:latest
        docker pull hyperledger/fabric-baseimage:x86_64-0.2.0
        docker tag hyperledger/fabric-baseimage:x86_64-0.2.0 hyperledger/fabric-baseimage:latest
    elif [ "${TEST_SUITE}" = "systest_ibm" ]; then
        DOCKER_FILE=${DIR}/ibm-docker-compose.yml
        docker pull ibmblockchain/fabric-membersrvc:x86_64-0.6.1-preview
        docker tag ibmblockchain/fabric-membersrvc:x86_64-0.6.1-preview ibmblockchain/fabric-membersrvc:latest
        docker pull ibmblockchain/fabric-peer:x86_64-0.6.1-preview
        docker tag ibmblockchain/fabric-peer:x86_64-0.6.1-preview ibmblockchain/fabric-peer:latest
        docker pull hyperledger/fabric-baseimage:x86_64-0.2.0
        docker tag hyperledger/fabric-baseimage:x86_64-0.2.0 hyperledger/fabric-baseimage:latest
    fi

    # Shut down the Docker containers for the system tests.
    cd ${DIR}
    docker-compose -f ${DOCKER_FILE} kill && docker-compose -f ${DOCKER_FILE} down

    # Start up the Docker containers for the system tests.
    docker-compose -f ${DOCKER_FILE} build

    # Run the system tests.
    if [ "${TRAVIS}" = "true" ]; then
        docker-compose -f ${DOCKER_FILE} run -e CONCERTO_PORT_WAIT_SECS=30 -e CONCERTO_DEPLOY_WAIT_SECS=120 --rm concerto npm run systesthlf
    else
        docker-compose -f ${DOCKER_FILE} run --rm concerto npm run systesthlf
    fi

    # Shut down the Docker containers for the system tests.
    docker-compose -f ${DOCKER_FILE} kill && docker-compose -f ${DOCKER_FILE} down
    ;;

*)

    # Barf if we don't recognize this test suite.
    echo Cannot determine how to execute the tests for this test suite: ${TEST_SUITE}
    exit 1
    ;;

esac
