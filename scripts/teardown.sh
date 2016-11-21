#!/bin/bash

# Exit on first error, print all commands.
set -ev

# Grab the Handel directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

# Shut down the Docker containers for the system tests.
cd ${DIR}/scripts
docker-compose kill && docker-compose down

# remove the local state
sudo rm -f /tmp/keyValStore/*

# Your system is now clean
