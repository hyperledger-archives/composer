#!/bin/bash

# Exit on first error, print all commands.
set -ev

# Grab the current directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

# Shut down the Docker containers for the system tests.
cd "${DIR}"/hlfv1
docker-compose -f hlfv1_alpha-docker-compose.yml kill && docker-compose -f hlfv1_alpha-docker-compose.yml down

# remove the local state
#rm -rf ~/.composer-connection-profiles/hlfv1
#rm -f ~/.hfc-key-store/*

# Your system is now clean
