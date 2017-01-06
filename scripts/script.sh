#!/bin/bash

# Exit on first error, print all commands.
set -ev
set -o pipefail

# Grab the Concerto directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

# Start the X virtual frame buffer used by Karma.
if [ -r "/etc/init.d/xvfb" ]; then
    export DISPLAY=:99.0
    sh -e /etc/init.d/xvfb start
fi

# Are we running system tests?
if [ "${SYSTEST}" != "" ]; then

    # Run the system tests.
    ${DIR}/packages/concerto-systests/scripts/run-system-tests.sh

# We must be running unit tests.
else

    # Run the unit tests.
    npm test 2>&1 | tee

fi
