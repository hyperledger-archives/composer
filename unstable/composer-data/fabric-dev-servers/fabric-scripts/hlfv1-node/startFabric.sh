#!/bin/bash

# Exit on first error, print all commands.
set -ev

# Grab the current directorydirectory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# need to do the npm install to get the node.js sdk for fabric
cd "{$DIR}"/../.. && npm install
cd "${DIR}"/hlfv1

docker-compose -f "${DIR}"/hlfv1/hlfv1_alpha-docker-compose.yml down
docker-compose -f "${DIR}"/hlfv1/hlfv1_alpha-docker-compose.yml up -d

# wait for Hyperledger Fabric to start
# incase of errors when running later commands, issue export FABRIC_START_TIMEOUT=<larger number>
echo ${FABRIC_START_TIMEOUT}
sleep ${FABRIC_START_TIMEOUT}

node create-channel.js
node join-channel.js

cd ../..
