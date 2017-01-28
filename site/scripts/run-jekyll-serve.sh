#!/bin/bash

# Exit on first error, print all commands.

set -ev

# Grab the Concerto directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

cd ${DIR}/out/jekylldocs

jekyll serve .
