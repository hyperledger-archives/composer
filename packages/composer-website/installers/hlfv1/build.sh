#!/bin/bash
set -ev
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "${DIR}"

# build the latest version of the installer - note the 0.8.0
cat install.sh.in | sed 's/{{ENV}}//g' | sed 's/{{ENV_VER}}/0.8.0/g' > install.sh
echo "PAYLOAD:" >> install.sh
tar czf - docker-compose-playground.yml fabric-dev-servers mychannel.tx twoorgs.genesis.block >> install.sh

# build the unstable installer
cat install.sh.in | sed 's/{{ENV}}/-unstable/g' | sed 's/{{ENV_VER}}/unstable/g' > install-unstable.sh
echo "PAYLOAD:" >> install-unstable.sh
tar czf - docker-compose-playground.yml fabric-dev-servers mychannel.tx twoorgs.genesis.block >> install-unstable.sh
