#!/bin/bash

# Exit on first error, print all commands.
set -v

# Grab the Concerto directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

# Check for the system tests.
case ${TEST_SUITE} in
system*)
    echo Not executing as running system tests.
    exit 0
    ;;
esac

rm $DIR/api.txt
node $DIR/node_modules/@ibm/ibm-concerto-common/lib/codegen/parsejs.js --format APISignature --inputDir "$DIR/lib" --outputDir $DIR

node $DIR/node_modules/@ibm/ibm-concerto-common/lib/tools/changelog.js --api "$DIR/api.txt" --changelog $DIR/changelog.txt
