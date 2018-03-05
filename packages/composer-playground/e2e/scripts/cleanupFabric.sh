#!/bin/bash

# Exit on first error, print all commands.
set -ev
set -o pipefail

# Grab the parent (root) directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

DOCKER_FILE=${DIR}/fabric/hlfv1/docker-compose.yml

ARCH=$ARCH docker-compose -f ${DOCKER_FILE} kill
ARCH=$ARCH docker-compose -f ${DOCKER_FILE} down
