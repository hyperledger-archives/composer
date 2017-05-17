#!/bin/bash
set -ev
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "${DIR}"
cp -f install.sh.in install.sh
echo "PAYLOAD:" >> install.sh
tar czf - docker-compose.yml >> install.sh
