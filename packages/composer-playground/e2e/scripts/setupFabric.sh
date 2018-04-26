#!/bin/bash
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

# Exit on first error, print all commands.
set -ev
set -o pipefail

# Set ARCH
ARCH=`uname -m`

# Grab the fabric directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

# have to have a clean card store or the tests will fail
rm -rf ${HOME}/.composer

cd "${DIR}"

# Set default timeouts
export COMPOSER_PORT_WAIT_SECS=30
export COMPOSER_DEPLOY_WAIT_SECS=500
export COMPOSER_TIMEOUT_SECS=500

DOCKER_FILE=${DIR}/fabric/hlfv1/docker-compose.yml

docker pull hyperledger/fabric-peer:$ARCH-1.1.0
docker pull hyperledger/fabric-ca:$ARCH-1.1.0
docker pull hyperledger/fabric-ccenv:$ARCH-1.1.0
docker pull hyperledger/fabric-orderer:$ARCH-1.1.0
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
docker rmi -f $(docker images -aq dev-*) || true
ARCH=$ARCH docker-compose -f ${DOCKER_FILE} up -d

# wait for the fabric to start
sleep 10
# Create the channel
docker exec -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.example.com/msp" peer0.org1.example.com peer channel create -o orderer.example.com:7050 -c composerchannel -f /etc/hyperledger/configtx/composer-channel.tx
# Join peer0 from org1 to the channel.
docker exec -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.example.com/msp" peer0.org1.example.com peer channel join -b composerchannel.block
# Fetch the channel.
docker exec -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org2.example.com/msp" peer0.org2.example.com peer channel fetch config -o orderer.example.com:7050 -c composerchannel composerchannel.block
# Join peer0 from org2 to the channel.
docker exec -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org2.example.com/msp" peer0.org2.example.com peer channel join -b composerchannel.block
