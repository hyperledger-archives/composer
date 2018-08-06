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

# Grab the parent (root) directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

# Switch into the integration tests directory.
cd "${DIR}"

# Set up environment variables for Fabric Docker image versions
. "../../scripts/fabric-docker-env.sh"

# Delete any existing configuration.
rm -rf ./pm2
rm -rf ./scripts/storage
rm -rf ${HOME}/.config/verdaccio
rm -rf ${HOME}/.composer/cards/Test*
rm -rf ${HOME}/.composer/client-data/Test*
rm -rf ${HOME}/.composer/cards/bob*
rm -rf ${HOME}/.composer/client-data/bob*
rm -rf ${HOME}/.composer/cards/admin*
rm -rf ${HOME}/.composer/client-data/admin*
rm -rf ${HOME}/.composer/cards/fred*
rm -rf ${HOME}/.composer/client-data/fred*
rm -rf ${HOME}/.composer/cards/sal*
rm -rf ${HOME}/.composer/client-data/sal*
rm -rf ${HOME}/.composer/cards/ange*
rm -rf ${HOME}/.composer/client-data/ange*
rm -rf ${HOME}/.composer/cards/charlie*
rm -rf ${HOME}/.composer/client-data/charlie*
rm -rf ${HOME}/.composer/cards/yaml*
rm -rf ${HOME}/.composer/client-data/yaml*
rm -rf ${HOME}/.composer/cards/lostmymarbles*
rm -rf ${HOME}/.composer/client-data/lostmymarbles*
rm -rf ./tmp/*           # temp folder for BNA files that are generated
rm -rf ./my-empty-bus-net      # a business network created from generator
rm -rf ./my-bus-net      # a business network created from generator
rm -rf ./tutorial-network      # business network created from generator in dev tut
rm -f ./networkadmin.card
rm -f ./composer-report-*
rm -rf ./my-angular-app
rm -rf ./my-loopback-app

# remove anything already there
docker kill $(docker ps -q) && docker rm $(docker ps -qa) --force


rm -rf ${HOME}/.npmrc
if [ "${DOCKER_FILE}" != "" ]; then
    rm /tmp/npmrc
    cd "${DIR}"
fi

# Barf if we don't recognize this test suite.
if [ "${INTEST}" = "" ]; then
    echo You must set INTEST to 'hlfv1' as it is the only supported test item
    echo For example:
    echo  export INTEST=hlfv1
    echo If you want to skip the HSM tests, you can set INTEST to 'hlfv1_nohsm'
    echo however it is recommended you do not skip the tests but ensure you
    echo has softhsm installed so the tests can be run.
    exit 1
fi

# Run for all specified configurations.
for INTEST in $(echo ${INTEST} | tr "," " "); do

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
        docker-compose -f ${DOCKER_FILE} kill
        docker-compose -f ${DOCKER_FILE} down
        docker rmi -f $(docker images -aq dev-*) || true
        docker-compose -f ${DOCKER_FILE} up -d
        cd ${DIR}
        cd ../composer-runtime-hlfv1
        if [ `uname` = "Darwin" ]; then
            export GATEWAY=docker.for.mac.localhost
        else
            export GATEWAY="$(docker inspect hlfv1_default | grep Gateway | cut -d \" -f4)"
        fi
        echo registry=http://${GATEWAY}:4873 > /tmp/npmrc
        echo fetch-retries=10 >> .npmrc
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
    echo '//localhost:4873/:_authToken="foo"' > ${HOME}/.npmrc
    echo fetch-retries=10 >> ${HOME}/.npmrc
    export npm_config_registry=http://localhost:4873

    # Start all test programs.
    npm run stop_ldap
    npm run start_ldap
    docker rm -f mongo || true
    docker run -d --name mongo -p 27017:27017 mongo

    (docker rm -f composer-wallet-redis || true) && \
       docker run -p 6379:6379 --name composer-wallet-redis -d redis  && \
       docker exec composer-wallet-redis redis-cli -c flushall

    (docker rm -f logspout || true) && \
        docker run -d --name="logspout" \
            --volume=/var/run/docker.sock:/var/run/docker.sock \
            --publish=127.0.0.1:8000:80 \
            gliderlabs/logspout

    # Run the integration tests.
    if [[ ${INTEST} == *nohsm ]]; then
        npm run int-test-nohsm 2>&1 | tee
    else
        npm run int-test 2>&1 | tee
    fi

    # Stop all test programs.
    docker rm -f mongo || true
    docker rm -f composer-wallet-redis || true
    npm run stop_ldap

    # Kill and remove any started Docker images.
    if [ "${DOCKER_FILE}" != "" ]; then
        docker-compose -f ${DOCKER_FILE} kill
        docker-compose -f ${DOCKER_FILE} down
        docker rmi -f $(docker images -aq dev-*) || true
    fi

    # Delete any written configuration.
    rm -rf ./pm2
    rm -rf ./scripts/storage
    rm -rf ${HOME}/.config/verdaccio
    rm -rf ${HOME}/.composer/cards/Test*
    rm -rf ${HOME}/.composer/client-data/Test*
    rm -rf ${HOME}/.composer/cards/bob*
    rm -rf ${HOME}/.composer/client-data/bob*
    rm -rf ${HOME}/.composer/cards/admin*
    rm -rf ${HOME}/.composer/client-data/admin*
    rm -rf ${HOME}/.composer/cards/fred*
    rm -rf ${HOME}/.composer/client-data/fred*
    rm -rf ${HOME}/.composer/cards/sal*
    rm -rf ${HOME}/.composer/client-data/sal*
    rm -rf ${HOME}/.composer/cards/ange*
    rm -rf ${HOME}/.composer/client-data/ange*
    rm -rf ./tmp/*
    rm -rf ./my-empty-bus-net
    rm -rf ./my-bus-net
    rm -rf ./tutorial-network
    rm -rf ./networkadmin
    rm -rf ${HOME}/.npmrc
    rm -f ./networkadmin.card
    rm -f ./composer-report-*
    rm -rf ./my-angular-app
    rm -rf ./my-loopback-app
    if [ "${DOCKER_FILE}" != "" ]; then
        cd ../composer-runtime-hlfv1
        rm /tmp/npmrc
        cd "${DIR}"
    fi

    # Delete any crypto-config material
    if [ -d ./hlfv1/crypto-config ]; then
        rm -rf ./hlfv1/crypto-config
    fi

done

