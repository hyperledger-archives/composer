#!/bin/bash

# Exit on first error, print all commands.
set -ev

# Grab the directory containing this script.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "${DIR}/installers"

# Build all of the installers.
for i in *
do
    $i/build.sh
    cp -f $i/install.sh ../jekylldocs/install-$i.sh
done
