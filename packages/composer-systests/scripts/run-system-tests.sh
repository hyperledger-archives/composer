#!/bin/bash

# Exit on first error, print all commands.
set -ev
set -o pipefail

# Grab the parent (root) directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

# Switch into the system tests directory.
cd "${DIR}"

# Barf if we don't recognize this test suite.
if [ "${SYSTEST}" = "" ]; then
    echo You must set SYSTEST to 'embedded', 'hlf', 'hlfv1', 'proxy', or 'web'
    echo For example:
    echo  export SYSTEST=hlf
    exit 1
fi

# Set default timeouts
export COMPOSER_PORT_WAIT_SECS=30
export COMPOSER_DEPLOY_WAIT_SECS=500
export COMPOSER_TIMEOUT_SECS=500

# Delete any existing configuration.
rm -rf ${HOME}/.composer-connection-profiles/composer-systests
rm -rf ${HOME}/.composer-credentials/composer-systests
rm -rf ${HOME}/.hfc-key-store

# Pull any required Docker images.
if [ "${SYSTEST}" = "hlf"  ]; then
    DOCKER_FILE=${DIR}/hlf/docker-compose.yml
    docker pull hyperledger/fabric-membersrvc:x86_64-0.6.1-preview
    docker tag hyperledger/fabric-membersrvc:x86_64-0.6.1-preview hyperledger/fabric-membersrvc:latest
    docker pull hyperledger/fabric-peer:x86_64-0.6.1-preview
    docker tag hyperledger/fabric-peer:x86_64-0.6.1-preview hyperledger/fabric-peer:latest
    docker pull hyperledger/fabric-baseimage:x86_64-0.1.0
    docker tag hyperledger/fabric-baseimage:x86_64-0.1.0 hyperledger/fabric-baseimage:latest
elif [[ ${SYSTEST} == hlfv1* ]]; then
    if [[ ${SYSTEST} == *tls ]]; then
        DOCKER_FILE=${DIR}/hlfv1/docker-compose.tls.yml
    else
        DOCKER_FILE=${DIR}/hlfv1/docker-compose.yml
    fi
    docker pull hyperledger/fabric-peer:x86_64-1.0.0-alpha2
    docker pull hyperledger/fabric-ca:x86_64-1.0.0-alpha2
    docker pull hyperledger/fabric-ccenv:x86_64-1.0.0-alpha2
    docker pull hyperledger/fabric-orderer:x86_64-1.0.0-alpha2
    docker pull hyperledger/fabric-couchdb:x86_64-1.0.0-alpha2
    if [ ! -d ./hlfv1/crypto-config ]; then
        cd hlfv1
        tar -xvf crypto-config.tar.gz
        cd ..
    fi
fi

# Start any required Docker images.
if [ "${DOCKER_FILE}" != "" ]; then
    echo Using docker file ${DOCKER_FILE}
    docker-compose -f ${DOCKER_FILE} kill
    docker-compose -f ${DOCKER_FILE} down
    docker-compose -f ${DOCKER_FILE} up -d
fi

# configure v1 to run the tests
if [[ ${SYSTEST} == hlfv1* ]]; then
    sleep 10
    if [[ ${SYSTEST} == *tls ]]; then
        # Create the channel
        docker exec -e "CORE_PEER_LOCALMSPID=Org1MSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.example.com" peer0.org1.example.com peer channel create -o orderer.example.com:7050 -c mychannel -f /etc/hyperledger/configtx/mychannel.tx --tls true --cafile /etc/hyperledger/orderer/example.com-cert.pem
        # Join peer0 to the channel.
        docker exec -e "CORE_PEER_LOCALMSPID=Org1MSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.example.com" peer0.org1.example.com peer channel join -b mychannel.block --tls true --cafile /etc/hyperledger/orderer/example.com-cert.pem
    else
        # Create the channel
        docker exec -e "CORE_PEER_LOCALMSPID=Org1MSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.example.com" peer0.org1.example.com peer channel create -o orderer.example.com:7050 -c mychannel -f /etc/hyperledger/configtx/mychannel.tx
        # Join peer0 to the channel.
        docker exec -e "CORE_PEER_LOCALMSPID=Org1MSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.example.com" peer0.org1.example.com peer channel join -b mychannel.block
    fi
fi

# Run the system tests.
npm run systest:${SYSTEST} 2>&1 | tee

# Kill and remove any started Docker images.
if [ "${DOCKER_FILE}" != "" ]; then
    docker-compose -f ${DOCKER_FILE} kill
    docker-compose -f ${DOCKER_FILE} down
fi


# Delete any written configuration.
rm -rf ${HOME}/.composer-connection-profiles/composer-systests
rm -rf ${HOME}/.composer-credentials/composer-systests
rm -rf ${HOME}/.hfc-key-store

# Delete any crypto-config material
if [ -d ./hlfv1/crypto-config ]; then
    rm -rf ./hlfv1/crypto-config
fi
