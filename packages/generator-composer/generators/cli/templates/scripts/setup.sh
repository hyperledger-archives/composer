#!/bin/bash

# Exit on first error, print all commands.
set -ev

# Grab the current directorydirectory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

# remove existing profiles and credentials
rm -rf ~/.composer-connection-profiles/*
rm -rf ~/.composer-credentials/*

# Shut down the Docker containers that might be currently running.
cd "${DIR}/scripts"
docker-compose kill && docker-compose down


# Pull and tag the latest Hyperledger Fabric base image.
docker pull hyperledger/fabric-baseimage:x86_64-0.1.0
docker tag hyperledger/fabric-baseimage:x86_64-0.1.0 hyperledger/fabric-baseimage:latest

# Start up the Docker containers
docker-compose build

# Start up the Hyperledger Fabric
docker-compose up -d

#
cd "${DIR}"

# Wait for the Hyperledger Fabric to start.
while ! nc localhost 7051 </dev/null; do sleep 1; done
while ! nc localhost 7053 </dev/null; do sleep 1; done
while ! nc localhost 7054 </dev/null; do sleep 1; done


sleep 5
