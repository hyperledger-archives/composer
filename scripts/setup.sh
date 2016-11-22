#!/bin/bash

# Exit on first error, print all commands.
set -ev

# Grab the Handel directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

# Shut down the Docker containers for the system tests.
cd ${DIR}/scripts
docker-compose kill && docker-compose down

# Pull and tag the latest Hyperledger Fabric base image.
docker pull hyperledger/fabric-baseimage:x86_64-0.1.0
docker tag hyperledger/fabric-baseimage:x86_64-0.1.0 hyperledger/fabric-baseimage:latest

# Start up the Docker containers for the system tests.
docker-compose build

# Start up the Hyperledger Fabric
docker-compose up -d

#
cd ${DIR}

# Wait for the Hyperledger Fabric to start.
sleep 5

#
#node lib/bootstrap.js
