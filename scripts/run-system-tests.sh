#!/bin/bash

# Exit on first error, print all commands.
set -ev

# Grab the Concerto directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

# Shut down the Docker containers for the system tests.
cd ${DIR}/systest
docker-compose kill && docker-compose down

# Pull and tag the latest Hyperledger Fabric images.
docker pull hyperledger/fabric-membersrvc:x86_64-0.6.0-preview
docker tag hyperledger/fabric-membersrvc:x86_64-0.6.0-preview hyperledger/fabric-membersrvc:latest
docker pull hyperledger/fabric-peer:x86_64-0.6.0-preview
docker tag hyperledger/fabric-peer:x86_64-0.6.0-preview hyperledger/fabric-peer:latest
docker pull hyperledger/fabric-baseimage:x86_64-0.1.0
docker tag hyperledger/fabric-baseimage:x86_64-0.1.0 hyperledger/fabric-baseimage:latest

# Start up the Docker containers for the system tests.
docker-compose build

# Run the system tests.
if [ "${TRAVIS}" = "true" ]; then
    docker-compose run -e CONCERTO_PORT_WAIT_SECS=30 -e CONCERTO_DEPLOY_WAIT_SECS=120 --rm concerto npm run systest
else
    docker-compose run --rm concerto npm run systest
fi

# Shut down the Docker containers for the system tests.
docker-compose kill && docker-compose down
