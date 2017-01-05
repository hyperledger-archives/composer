#!/bin/bash

# Print all commands.
set -v

# delete all existing containers and images
read -p "Press y to delete all docker containers and images." -n 1 -r
echo    # (optional) move to a new line
if [[ $REPLY =~ ^[Yy]$ ]]
then
  docker rm $(docker ps -a -q) -f
  docker rmi $(docker images -q) -f
fi

# Pull and tag the latest Hyperledger Fabric images.
docker pull hyperledger/fabric-membersrvc:x86_64-0.6.0-preview
docker tag hyperledger/fabric-membersrvc:x86_64-0.6.0-preview hyperledger/fabric-membersrvc:latest
docker pull hyperledger/fabric-peer:x86_64-0.6.0-preview
docker tag hyperledger/fabric-peer:x86_64-0.6.0-preview hyperledger/fabric-peer:latest
docker pull hyperledger/fabric-baseimage:x86_64-0.1.0
docker tag hyperledger/fabric-baseimage:x86_64-0.1.0 hyperledger/fabric-baseimage:latest
