#!/bin/bash
set -ev
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "${DIR}"
#cp -f install.sh.in install.sh
cat install.sh.in | sed 's/{{ENV}}//g' > install.sh
echo "PAYLOAD:" >> install.sh
tar czf - crypto-config docker-compose.yml docker-compose-playground.yml fabric-dev-servers mychannel.tx twoorgs.orderer.block >> install.sh

cat install.sh.in | sed 's/{{ENV}}/-unstable/g' > install-unstable.sh
echo "PAYLOAD:" >> install-unstable.sh
tar czf - crypto-config docker-compose.yml docker-compose-playground-unstable.yml fabric-dev-servers mychannel.tx twoorgs.orderer.block >> install-unstable.sh
