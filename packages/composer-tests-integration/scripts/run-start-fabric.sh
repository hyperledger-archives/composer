#!/bin/bash

# Exit on first error, print all commands.
set -ev
set -o pipefail

# Set ARCH
ARCH=`uname -m`

# Grab the parent (root) directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"    
    
    # Set default timeouts
    export COMPOSER_PORT_WAIT_SECS=30
    export COMPOSER_DEPLOY_WAIT_SECS=500
    export COMPOSER_TIMEOUT_SECS=500

    # Pull any required Docker images.
    if [[ ${INTEST} == hlfv1* ]]; then
        if [[ ${INTEST} == *tls ]]; then
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
        cd ${DIR}
        cd ../composer-runtime-hlfv1
        if [ `uname` = "Darwin" ]; then
            export GATEWAY=docker.for.mac.localhost
        else
            export GATEWAY="$(docker inspect hlfv1_default | grep Gateway | cut -d \" -f4)"
        fi
        echo registry=http://${GATEWAY}:4873 > .npmrc
        echo fetch-retries=10 >> .npmrc
    fi
