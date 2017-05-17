#!/bin/bash

# Exit on first error, print all commands.
set -ev

# Grab the current directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

# Shut down the Docker containers that might be currently running.
cd "${DIR}"/scripts
docker-compose kill && docker-compose down

# TODO change this to alter the default profile which is, by convention, a local running hyperledger fabric
rm -rf ~/.composer-connection-profiles/defaultProfile/*
rm -rf ~/.composer-credentials/*


# delete all existing containers and images
# This is not used in general usage but this might
#read -p "Press y to delete all docker containers images" -n 1 -r
#echo    # (optional) move to a new line
#if [[ $REPLY =~ ^[Yy]$ ]]
#then
#  docker rm $(docker ps -a -q) -f
#  docker rmi $(docker images -q) -f
#fi

# Pull and tag the latest Hyperledger Fabric base image.
docker pull hyperledger/fabric-baseimage:x86_64-0.1.0
docker tag hyperledger/fabric-baseimage:x86_64-0.1.0 hyperledger/fabric-baseimage:latest
