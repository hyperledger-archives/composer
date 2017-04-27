#!/bin/bash

# Exit on first error, print all commands.
set -ev

rm -rf ~/.composer-connection-profiles/hlfv1/*
rm -rf ~/.hfc-key-store/*

# create a composer connection profile
mkdir -p ~/.composer-connection-profiles/hlfv1
cat << EOF > ~/.composer-connection-profiles/hlfv1/connection.json
{
    "type": "hlfv1",
    "orderers": [
        "grpc://localhost:7050"
    ],
    "ca": "http://localhost:7054",
    "peers": [
        {
            "requestURL": "grpc://localhost:7051",
            "eventURL": "grpc://localhost:7053"
        },
        {
            "requestURL": "grpc://localhost:7056",
            "eventURL": "grpc://localhost:7058"
        }
    ],
    "keyValStore": "${HOME}/.hfc-key-store",
    "channel": "mychannel",
    "mspID": "Org1MSP",
    "deployWaitTime": "300",
    "invokeWaitTime": "100"
}
EOF


