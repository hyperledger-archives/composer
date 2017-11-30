#!/bin/bash

# Exit on first error, print all commands.
set -ev
set -o pipefail

# Set ARCH
ARCH=`uname -m`

# Grab the parent (root) directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

# Switch into the integration tests directory.
cd "${DIR}"

# Barf if we don't recognize this test suite.
if [ "${INTEST}" = "" ]; then
    echo You must set INTEST to 'hlfv1' as it is the only supported test item
    echo separated list of a set of integration test configurations to run.
    echo For example:
    echo  export INTEST=hlfv1
    exit 1
fi

# Run for all specified configurations.
for INTEST in $(echo ${INTEST} | tr "," " "); do

    # Set default timeouts
    export COMPOSER_PORT_WAIT_SECS=30
    export COMPOSER_DEPLOY_WAIT_SECS=500
    export COMPOSER_TIMEOUT_SECS=500

    # Delete any existing configuration.
    rm -rf ${HOME}/.composer-connection-profiles/composer-intests*
    rm -rf ${HOME}/.composer-credentials/composer-intests*

    # Pull any required Docker images.
    if [[ ${INTEST} == hlfv1* ]]; then
        if [[ ${INTEST} == *tls ]]; then
            DOCKER_FILE=${DIR}/hlfv1/docker-compose.tls.yml
        else
            DOCKER_FILE=${DIR}/hlfv1/docker-compose.yml
        fi
        docker pull hyperledger/fabric-peer:$ARCH-1.1.0-preview
        docker pull hyperledger/fabric-ca:$ARCH-1.1.0-preview
        docker pull hyperledger/fabric-ccenv:$ARCH-1.1.0-preview
        docker pull hyperledger/fabric-orderer:$ARCH-1.1.0-preview
        docker pull hyperledger/fabric-couchdb:$ARCH-1.1.0-preview
        docker pull verdaccio/verdaccio:2.6.4
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
        cd ${DIR}
        cd ../composer-runtime-hlfv1
        GATEWAY="$(docker inspect hlfv1_default | grep Gateway | cut -d \" -f4)"
        echo registry=http://${GATEWAY}:4873 > .npmrc
    fi

    # configure v1 to run the tests
    if [[ ${INTEST} == hlfv1* ]]; then
        sleep 10
        if [[ ${INTEST} == *tls ]]; then
            # Create the channel
            docker exec -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.example.com/msp" peer0.org1.example.com peer channel create -o orderer.example.com:7050 -c composerchannel -f /etc/hyperledger/configtx/composer-channel.tx --tls true --cafile /etc/hyperledger/orderer/tls/ca.crt
            # Join peer0 to the channel.
            docker exec -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.example.com/msp" peer0.org1.example.com peer channel join -b composerchannel.block --tls true --cafile /etc/hyperledger/orderer/tls/ca.crt
            # Fetch the channel.
            docker exec -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org2.example.com/msp" peer0.org2.example.com peer channel fetch config -o orderer.example.com:7050 -c composerchannel composerchannel.block --tls --cafile /etc/hyperledger/orderer/tls/ca.crt
            # Join peer0 from org2 to the channel.
            docker exec -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org2.example.com/msp" peer0.org2.example.com peer channel join -b composerchannel.block --tls true --cafile /etc/hyperledger/orderer/tls/ca.crt
        else
            # Create the channel
            docker exec -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.example.com/msp" peer0.org1.example.com peer channel create -o orderer.example.com:7050 -c composerchannel -f /etc/hyperledger/configtx/composer-channel.tx
            # Join peer0 from org1 to the channel.
            docker exec -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.example.com/msp" peer0.org1.example.com peer channel join -b composerchannel.block
            # Fetch the channel.
            docker exec -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org2.example.com/msp" peer0.org2.example.com peer channel fetch config -o orderer.example.com:7050 -c composerchannel composerchannel.block
            # Join peer0 from org2 to the channel.
            docker exec -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org2.example.com/msp" peer0.org2.example.com peer channel join -b composerchannel.block
        fi
    fi

    # Switch back to the integration tests directory.
    cd "${DIR}"

    # Verdaccio server requires a dummy user if publishing via npm
    touch ${HOME}/.npmrc
    echo '//localhost:4873/:_authToken="foo"' > ${HOME}/.npmrc

    # Run the integration tests.
    npm run int-test 2>&1 | tee

    # Kill and remove any started Docker images.
    if [ "${DOCKER_FILE}" != "" ]; then
        ARCH=$ARCH docker-compose -f ${DOCKER_FILE} kill
        ARCH=$ARCH docker-compose -f ${DOCKER_FILE} down
    fi

    # Delete any written configuration.
    rm -fr ./verdaccio
    rm -fr ./storage
    rm -fr ${HOME}/.config/verdaccio
    rm -rf ${HOME}/.composer/cards/Test*
    rm -rf ${HOME}/.composer/client-data/Test*
    rm -rf ./tmp/*
    rm -rf ./networkadmin
    rm -rf ${HOME}/.npmrc
    if [ "${DOCKER_FILE}" != "" ]; then
        cd ../composer-runtime-hlfv1
        rm .npmrc
        cd "${DIR}"
    fi

    # Delete any crypto-config material
    if [ -d ./hlfv1/crypto-config ]; then
        rm -rf ./hlfv1/crypto-config
    fi

done
