#!/bin/bash

# Exit on first error, print all commands.
set -ev
set -o pipefail

# Set ARCH
ARCH=`uname -m`

# Grab the fabric directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

rm -rf ${HOME}/.composer/cards/Test*
rm -rf ${HOME}/.composer/client-data/Test*
rm -rf ${HOME}/.composer/cards/admin*
rm -rf ${HOME}/.composer/client-data/admin*

cd "${DIR}"

# Set default timeouts
export COMPOSER_PORT_WAIT_SECS=30
export COMPOSER_DEPLOY_WAIT_SECS=500
export COMPOSER_TIMEOUT_SECS=500

DOCKER_FILE=${DIR}/fabric/hlfv1/docker-compose.yml

docker pull hyperledger/fabric-peer:$ARCH-1.1.0-rc1
docker pull hyperledger/fabric-ca:$ARCH-1.1.0-rc1
docker pull hyperledger/fabric-ccenv:$ARCH-1.1.0-rc1
docker pull hyperledger/fabric-orderer:$ARCH-1.1.0-rc1
docker pull hyperledger/fabric-couchdb:$ARCH-0.4.6

if [ -d ./hlfv1/crypto-config ]; then
    rm -rf ./hlfv1/crypto-config
fi

cd "${DIR}"/fabric/hlfv1

tar -xvf crypto-config.tar.gz

for KEY in $(find crypto-config -type f -name "*_sk"); do
    KEY_DIR=$(dirname ${KEY})
    mv ${KEY} ${KEY_DIR}/key.pem
done

echo Using docker file ${DOCKER_FILE}
ARCH=$ARCH docker-compose -f ${DOCKER_FILE} kill
ARCH=$ARCH docker-compose -f ${DOCKER_FILE} down
ARCH=$ARCH docker-compose -f ${DOCKER_FILE} up -d

# Create the channel
docker exec -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.example.com/msp" peer0.org1.example.com peer channel create -o orderer.example.com:7050 -c composerchannel -f /etc/hyperledger/configtx/composer-channel.tx
# Join peer0 from org1 to the channel.
docker exec -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.example.com/msp" peer0.org1.example.com peer channel join -b composerchannel.block
# Fetch the channel.
docker exec -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org2.example.com/msp" peer0.org2.example.com peer channel fetch config -o orderer.example.com:7050 -c composerchannel composerchannel.block
# Join peer0 from org2 to the channel.
docker exec -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org2.example.com/msp" peer0.org2.example.com peer channel join -b composerchannel.block
