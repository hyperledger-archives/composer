#!/bin/bash

# Exit on first error, print all commands.
set -ev

# Grab the directory containing this script.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "${DIR}/installers"

curl -O https://raw.githubusercontent.com/hyperledger/composer-tools/master/packages/fabric-dev-servers/fabric-dev-servers.zip


# Build all of the installers.
for i in hlf*
do
    echo $i/fabric-dev-servers/
    unzip fabric-dev-servers.zip -d $i/fabric-dev-servers/
    $i/build.sh
    cp -f $i/install.sh ../jekylldocs/install-$i.sh
done
