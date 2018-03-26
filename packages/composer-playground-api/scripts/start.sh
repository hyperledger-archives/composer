#!/bin/bash

# Exit on first error, print all commands
set -ev

# Environment vaiable directs Playground (connector server) to an npmrc to supply to network install
export NPMRC_FILE=/tmp/npmrc

# Switch to package root directory
cd "$(dirname "${BASH_SOURCE[0]}")/.."

# Delete any existing configuration
rm -rf ./scripts/storage

# Create the npmrc for use by Playground
if [ `uname` = "Darwin" ]; then
    export GATEWAY=docker.for.mac.localhost
else
    export GATEWAY="$(docker inspect hlfv1_default | grep Gateway | cut -d \" -f4)"
fi
echo "registry=http://${GATEWAY}:4873" > ${NPMRC_FILE}

# Start the npm proxy
./node_modules/.bin/verdaccio --listen '0.0.0.0:4873' --config scripts/config.yaml &
verdaccio_pid=$!

# Publish development versions of packages required at runtime
for package in composer-common composer-runtime composer-runtime-hlfv1; do
    npm publish --registry 'http://localhost:4873' "../${package}"
done

# Start the Playground API
npm start

# Stop the npm proxy
kill ${verdaccio_pid}

# Wipe out configuration
rm -rf ./scripts/storage
