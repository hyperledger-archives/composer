#!/bin/bash

# Exit on first error, print all commands.
set -ev
set -o pipefail

# Called by package.json start-verdaccio
# Need to setup a 'npmrc'
echo "Setting npmrc config file in: /tmp/npmrc"

if [ `uname` = "Darwin" ]; then
    GATEWAY=docker.for.mac.localhost
else
    GATEWAY="$(docker inspect hlfv1_default | grep Gateway | cut -d \" -f4)"
fi
echo "Setting gateway http://${GATEWAY}:4874"
echo registry=http://${GATEWAY}:4874 > /tmp/npmrc
echo fetch-retries=10 >> /tmp/npmrc

# Verdaccio server requires a dummy user if publishing via npm
touch ${HOME}/.npmrc
echo '//localhost:4874/:_authToken="foo"' > ${HOME}/.npmrc
echo fetch-retries=10 >> ${HOME}/.npmrc
