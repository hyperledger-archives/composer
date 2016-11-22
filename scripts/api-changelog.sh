#!/bin/bash

# Exit on first error, print all commands.
set -v

# Grab the Concerto directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

rm $DIR/api.txt
node $DIR/lib/codegen/parsejs.js --format APISignature --inputDir "$DIR/lib" --outputDir $DIR

node $DIR/lib/tools/changelog.js --api "$DIR/api.txt" --changelog $DIR/changelog.txt
