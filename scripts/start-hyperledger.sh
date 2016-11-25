#!/bin/bash

# Exit on first error, print all commands.
set -v

cd ./dev
docker-compose kill;
docker-compose down;
docker rm $(docker ps -a -q);

rm -rf /tmp/keyValStore;

docker-compose up -d;

sleep 5;
