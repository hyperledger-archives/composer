#!/bin/bash

# Exit on first error, print all commands.
set -ev

# Grab the current directorydirectory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

#
cd "${DIR}"/scripts

# Start up the Hyperledger Fabric
docker-compose up -d --build


# Wait for the Hyperledger Fabric to start.
while ! nc localhost 7051 </dev/null; do sleep 1; done
while ! nc localhost 7053 </dev/null; do sleep 1; done
while ! nc localhost 7054 </dev/null; do sleep 1; done
sleep 5