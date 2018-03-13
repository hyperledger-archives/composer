#!/bin/bash

# Exit on first error, print all commands.
set -ev
set -o pipefail

# Work from parent (root) e2e directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
echo "cleaning folders in ${DIR} and ${HOME}"
rm -rf ${DIR}/downloads
rm -rf ${DIR}/tmp/*.bna
rm -rf ${DIR}/verdaccio/storage/*
rm -rf ${DIR}/fabric/cards/*.card
rm -rf ${HOME}/.composer/cards/Test*
rm -rf ${HOME}/.composer/client-data/Test*
rm -rf ${HOME}/.composer/cards/admin*
rm -rf ${HOME}/.composer/client-data/admin*
