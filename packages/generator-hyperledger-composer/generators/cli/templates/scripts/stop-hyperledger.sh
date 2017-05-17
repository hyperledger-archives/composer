#!/bin/bash

# Exit on first error, print all commands.
set -ev

# Grab the current directorydirectory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

# Shut down the Docker containers that might be currently running.
cd "${DIR}"/scripts
docker-compose stop
