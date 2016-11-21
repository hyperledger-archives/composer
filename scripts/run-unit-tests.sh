#!/bin/bash

# Exit on first error, print all commands.
set -ev

# Grab the Concerto directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

# Run the node.js unit tests.
npm test

# Install gimme for installing Go.
export PATH=~/bin:${PATH}

# Install and use the latest version of Go.
eval "$(gimme 1.7)"

# Run the Go unit tests.
export GOPATH=${DIR}/chaincode
cd ${GOPATH}/src/concerto
go vet $(go list ./... | grep -v /vendor/)
go test -v $(go list ./... | grep -v /vendor/)
