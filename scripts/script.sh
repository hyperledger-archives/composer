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

# Are we running unit tests?
if [ "${SYSTEST}" = "" ]; then

    # Run the unit tests.
    npm test 2>&1 | tee

# No, we must be running system tests.
else

    # Run the system tests.
    cd packages/concerto-systests
    npm run systest:${SYSTEST} 2>&1 | tee

fi
