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
