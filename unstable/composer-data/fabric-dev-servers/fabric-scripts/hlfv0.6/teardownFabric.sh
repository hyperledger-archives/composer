#!/bin/bash

# Exit on first error, print all commands.
set -ev

# Grab the current directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Shut down the Docker containers for the system tests.
docker-compose -f ${DIR}/docker-compose.yml kill && docker-compose -f ${DIR}/docker-compose.yml down

# Your system is now clean
# Removing the existing profile for the Composer Connection Profiles
rm -rf ~/.composer-connection-profiles/defaultProfile/*
rm -rf ~/.composer-credentials/*
