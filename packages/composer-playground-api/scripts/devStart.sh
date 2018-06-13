#!/bin/bash
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

# Exit on first error, print all commands
set -ev

# Environment vaiable directs Playground (connector server) to an npmrc to supply to network install
export NPMRC_FILE='/tmp/npmrc'

scriptDir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
packagesDir="$(cd "${scriptDir}/../.." && pwd)"

# Create the npmrc for use by Playground
if [ `uname` = "Darwin" ]; then
    gateway=docker.for.mac.localhost
else
    gateway="$(docker inspect composer_default | grep Gateway | cut -d \" -f4)"
fi
echo "registry=http://${gateway}:4873" > "${NPMRC_FILE}"

# Start the npm proxy
docker-compose -f "${scriptDir}/docker-compose.yaml" up -d

# Publish development versions of packages required at runtime
for package in composer-common composer-runtime composer-runtime-hlfv1; do
    npm publish --userconfig "${scriptDir}/publish.npmrc" "${packagesDir}/${package}"
done

# Start the Playground API
npm start

# Stop the npm proxy
docker-compose -f "${scriptDir}/docker-compose.yaml" down
