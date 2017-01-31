#!/bin/bash

# Exit on first error, print all commands.
set -ev

# Grab the Composer-CLI directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

# Install the node.js dependencies.
npm install
