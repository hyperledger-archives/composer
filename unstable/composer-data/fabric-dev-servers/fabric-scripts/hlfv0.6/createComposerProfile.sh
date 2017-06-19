#!/bin/sh

# Removing the existing profile for the Composer Connection Profiles
rm -rf ~/.composer-connection-profiles/defaultProfile/*
rm -rf ~/.composer-credentials/*

# create a composer connection profile
mkdir -p ~/.composer-connection-profiles/defaultProfile
cat << EOF > ~/.composer-connection-profiles/defaultProfile/connection.json
{
    "type": "hlf",
    "membershipServicesURL": "grpc://localhost:7054",
    "peerURL": "grpc://localhost:7051",
    "eventHubURL": "grpc://localhost:7053",
    "keyValStore": "${HOME}/.composer-credentials",
    "deployWaitTime": "300",
    "invokeWaitTime": "100"

}
EOF

echo "Hyperledger Composer profile has been created for the Hyperledger Fabric v0.6 instance"
