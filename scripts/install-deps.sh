#!/bin/bash

# Exit on first error, print all commands.
set -ev

# Grab the Concerto directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

# Check for the system tests.
case ${TEST_SUITE} in
system*)
    echo Not executing as running system tests.
    exit 0
esac

# Install the node.js dependencies.
npm install

# Install gimme for installing Go.
mkdir -p ~/bin
export PATH=~/bin:${PATH}
curl -sL -o ~/bin/gimme https://raw.githubusercontent.com/travis-ci/gimme/master/gimme
chmod +x ~/bin/gimme

# Install and use the latest version of Go.
eval "$(gimme 1.7)"

# Copy the chaincode into the Go path.
export GOPATH=${DIR}/chaincode
export PATH=${GOPATH}/bin:${PATH}

# Install the Go dependencies.
cd ${GOPATH}/src
go get $(go list ./... | grep -v /vendor/)
go get github.com/golang/lint/golint
