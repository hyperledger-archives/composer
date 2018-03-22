#!/bin/bash

# Exit on first error, print all commands.
set -ev
set -o pipefail

# Set ARCH
ARCH=`uname -m`

# Grab the parent (root) directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

# Switch into the system tests directory.
cd "${DIR}"

# Barf if we don't recognize this test suite.
if [ "${FVTEST}" = "" ]; then
    echo You must set FVTEST to 'embedded', 'hlfv1', 'proxy', or 'web', or a comma
    echo separated list of a set of system test configurations to run.
    echo For example:
    echo  export FVTEST=hlfv1
    echo  export FVTEST=embedded,proxy,web
    exit 1
fi

# Run for all specified configurations.
for FVTEST in $(echo ${FVTEST} | tr "," " "); do

    # Set default timeouts
    export COMPOSER_PORT_WAIT_SECS=30
    export COMPOSER_DEPLOY_WAIT_SECS=500
    export COMPOSER_TIMEOUT_SECS=500

    # Delete any existing configuration.
    rm -rf ${HOME}/.composer/*

    # Pull any required Docker images.
    if [[ ${FVTEST} == hlfv1* ]]; then
        if [[ ${FVTEST} == *tls ]]; then
            DOCKER_FILE=${DIR}/hlfv1/docker-compose.tls.yml
        else
            DOCKER_FILE=${DIR}/hlfv1/docker-compose.yml
        fi
        docker pull hyperledger/fabric-peer:$ARCH-1.1.0
        docker pull hyperledger/fabric-ca:$ARCH-1.1.0
        docker pull hyperledger/fabric-ccenv:$ARCH-1.1.0
        docker pull hyperledger/fabric-orderer:$ARCH-1.1.0
        docker pull hyperledger/fabric-couchdb:$ARCH-0.4.6
        if [ -d ./hlfv1/crypto-config ]; then
            rm -rf ./hlfv1/crypto-config
        fi
        cd hlfv1
        tar -xvf crypto-config.tar.gz
        # Rename all the keys so we don't have to maintain them in the code.
        for KEY in $(find crypto-config -type f -name "*_sk"); do
            KEY_DIR=$(dirname ${KEY})
            mv ${KEY} ${KEY_DIR}/key.pem
        done
    fi

    # Start any required Docker images.
    if [ "${DOCKER_FILE}" != "" ]; then
        echo Using docker file ${DOCKER_FILE}
        ARCH=$ARCH docker-compose -f ${DOCKER_FILE} kill
        ARCH=$ARCH docker-compose -f ${DOCKER_FILE} down
        ARCH=$ARCH docker-compose -f ${DOCKER_FILE} up -d

        cd "${DIR}"
        cd ../composer-runtime
        npm pack
        cd ../composer-common
        npm pack
        cd ../composer-runtime-hlfv1
        npm pack
        cd "${DIR}"

        if [ `uname` = "Darwin" ]; then
            export GATEWAY=docker.for.mac.localhost
        else
            export GATEWAY="$(docker inspect hlfv1_default | grep Gateway | cut -d \" -f4)"
        fi
    fi

    # configure v1 to run the tests
    if [[ ${FVTEST} == hlfv1* ]]; then
        sleep 10
        if [[ ${FVTEST} == *tls ]]; then
            # Create the channel
            docker exec -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.example.com/msp" peer0.org1.example.com peer channel create -o orderer.example.com:7050 -c composerchannel -f /etc/hyperledger/configtx/composer-channel.tx --tls true --cafile /etc/hyperledger/orderer/tls/ca.crt
            # Join peer0 to the channel.
            docker exec -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.example.com/msp" peer0.org1.example.com peer channel join -b composerchannel.block --tls true --cafile /etc/hyperledger/orderer/tls/ca.crt
            # Fetch the channel.
            docker exec -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org2.example.com/msp" peer0.org2.example.com peer channel fetch config -o orderer.example.com:7050 -c composerchannel composerchannel.block --tls --cafile /etc/hyperledger/orderer/tls/ca.crt
            # Join peer0 from org2 to the channel.
            docker exec -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org2.example.com/msp" peer0.org2.example.com peer channel join -b composerchannel.block --tls true --cafile /etc/hyperledger/orderer/tls/ca.crt

            # Create the other channel
            docker exec -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.example.com/msp" peer0.org1.example.com peer channel create -o orderer.example.com:7050 -c othercomposerchannel -f /etc/hyperledger/configtx/othercomposer-channel.tx --tls true --cafile /etc/hyperledger/orderer/tls/ca.crt
            # Join peer0 to the channel.
            docker exec -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.example.com/msp" peer0.org1.example.com peer channel join -b othercomposerchannel.block --tls true --cafile /etc/hyperledger/orderer/tls/ca.crt
            # Fetch the channel.
            docker exec -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org2.example.com/msp" peer0.org2.example.com peer channel fetch config -o orderer.example.com:7050 -c othercomposerchannel othercomposerchannel.block --tls --cafile /etc/hyperledger/orderer/tls/ca.crt
            # Join peer0 from org2 to the channel.
            docker exec -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org2.example.com/msp" peer0.org2.example.com peer channel join -b othercomposerchannel.block --tls true --cafile /etc/hyperledger/orderer/tls/ca.crt
        else
            # Create the channel
            docker exec -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.example.com/msp" peer0.org1.example.com peer channel create -o orderer.example.com:7050 -c composerchannel -f /etc/hyperledger/configtx/composer-channel.tx
            # Join peer0 from org1 to the channel.
            docker exec -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.example.com/msp" peer0.org1.example.com peer channel join -b composerchannel.block
            # Fetch the channel.
            docker exec -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org2.example.com/msp" peer0.org2.example.com peer channel fetch config -o orderer.example.com:7050 -c composerchannel composerchannel.block
            # Join peer0 from org2 to the channel.
            docker exec -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org2.example.com/msp" peer0.org2.example.com peer channel join -b composerchannel.block

            # Create the other channel
            docker exec -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.example.com/msp" peer0.org1.example.com peer channel create -o orderer.example.com:7050 -c othercomposerchannel -f /etc/hyperledger/configtx/othercomposer-channel.tx
            # Join peer0 from org1 to the channel.
            docker exec -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.example.com/msp" peer0.org1.example.com peer channel join -b othercomposerchannel.block
            # Fetch the channel.
            docker exec -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org2.example.com/msp" peer0.org2.example.com peer channel fetch config -o orderer.example.com:7050 -c othercomposerchannel othercomposerchannel.block
            # Join peer0 from org2 to the channel.
            docker exec -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org2.example.com/msp" peer0.org2.example.com peer channel join -b othercomposerchannel.block
        fi
    fi

    # Start all test programs.
    npm run stop_http
    npm run start_http

    # Run the system tests.
    npm run systest:${FVTEST} 2>&1 | tee

    # Stop all test programs.
    npm run stop_http

    # Kill and remove any started Docker images.
    if [ "${DOCKER_FILE}" != "" ]; then
        ARCH=$ARCH docker-compose -f ${DOCKER_FILE} kill
        ARCH=$ARCH docker-compose -f ${DOCKER_FILE} down
    fi

    # Delete any written configuration.
    rm -fr ${HOME}/.composer

    # Delete any crypto-config material
    cd "${DIR}"
    if [ -d ./hlfv1/crypto-config ]; then
        rm -rf ./hlfv1/crypto-config
    fi

    # remove the npm pack files
    rm ../composer-common/composer-common-*.tgz || true
    rm ../composer-runtime/composer-runtime-*.tgz || true
    rm ../composer-runtime-hlfv1/composer-runtime-hlfv1-*.tgz || true

done
