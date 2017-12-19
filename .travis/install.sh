#!/bin/bash

# Exit on first error, print all commands.
set -ev
set -o pipefail

# Bring in the standard set of script utilities
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
source ${DIR}/.travis/base.sh
# ----

# Use lerna bootstrap and not npm install; it's a lot faster in Travis.
cd ${DIR}
lerna bootstrap 2>&1

_exit "All Complete" 0
