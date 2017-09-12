#!/bin/bash

# Exit on first error, print all commands.
set -ev

# Grab the current directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Pull and tag the latest Hyperledger Fabric base image.
docker pull hyperledger/fabric-peer:x86_64-1.0.1
docker pull hyperledger/fabric-ca:x86_64-1.0.1
docker pull hyperledger/fabric-ccenv:x86_64-1.0.1
docker pull hyperledger/fabric-orderer:x86_64-1.0.1
docker pull hyperledger/fabric-couchdb:x86_64-1.0.1
