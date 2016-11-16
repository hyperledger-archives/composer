#!/bin/bash

# Exit on first error, print all commands.
set -ev

# Grab the Concerto directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

# Run the unit tests.
if [ "${TEST_SUITE}" = "" -o "${TEST_SUITE}" = "unit" ]; then
    ${DIR}/scripts/run-unit-tests.sh
fi

# Run the system tests.
if [ "${TEST_SUITE}" = "" -o "${TEST_SUITE}" = "system_hlf" -o "${TEST_SUITE}" = "system_ibm" ]; then
    ${DIR}/scripts/run-system-tests.sh
fi
