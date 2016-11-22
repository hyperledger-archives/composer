#!/bin/bash

# Exit on first error, print all commands.
set -ev

# Grab the Concerto directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

# Run the unit tests.
${DIR}/scripts/run-unit-tests.sh

# Run the system tests.
${DIR}/scripts/run-system-tests.sh
