#!/bin/bash

# Exit on first error, print all commands.
set -ev

# Grab the current directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

# Shut down the Docker containers for the system tests.
cd "${DIR}"/scripts
docker-compose kill && docker-compose down

# remove the local state
rm -rf ~/.composer-connection-profiles/defaultProfile
rm -f ~/.composer-credentials/*

# Your system is now clean
