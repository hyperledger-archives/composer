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

# Work from parent (root) e2e directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
echo "cleaning folders in ${DIR} and ${HOME}"
rm -rf ${DIR}/downloads
rm -rf ${DIR}/tmp/*.bna
rm -rf ${DIR}/tmp/*.card
rm -rf ${DIR}/verdaccio/storage/*
rm -rf ${DIR}/fabric/cards/*.card
rm -rf ${HOME}/.composer/cards/Test*
rm -rf ${HOME}/.composer/client-data/Test*
rm -rf ${HOME}/.composer/cards/admin*
rm -rf ${HOME}/.composer/client-data/admin*
rm -rf ${HOME}/.composer/cards/king_conga*
rm -rf ${HOME}/.composer/client-data/king_conga*