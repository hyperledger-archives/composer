#!/bin/bash
set -ev
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "${DIR}"
cp -f install.sh.in install.sh
echo "PAYLOAD:" >> install.sh
tar czf - crypto-config docker-compose.yml docker-compose-playground.yml fabric-dev-servers mychannel.tx twoorgs.orderer.block >> install.sh
