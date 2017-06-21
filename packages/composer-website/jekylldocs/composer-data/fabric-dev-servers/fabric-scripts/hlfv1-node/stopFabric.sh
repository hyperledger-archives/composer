#!/bin/bash

# Exit on first error, print all commands.
set -ev

# Grab the current directorydirectory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Shut down the Docker containers that might be currently running.
cd "${DIR}"/hlfv1
docker-compose -f "${DIR}"/hlfv1/hlfv1_alpha-docker-compose.yml stop
