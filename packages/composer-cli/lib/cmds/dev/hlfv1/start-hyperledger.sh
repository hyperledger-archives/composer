#!/bin/bash

# Exit on first error, print all commands.
set -ev

# Grab the current directorydirectory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

#
cd "${DIR}"/hlfv1

docker-compose -f hlfv1_alpha-docker-compose.yml down
docker rm $(docker ps -aq) || docker-compose -f hlfv1_alpha-docker-compose.yml up -d

# wait for Hyperledger Fabric to start 
sleep 10

node create-channel.js
node join-channel.js
cd ../..
