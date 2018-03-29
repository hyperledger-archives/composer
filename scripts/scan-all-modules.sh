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

# find .  -maxdepth 2 -name package.json | xargs jq -s 'reduce .[] as $item ({} ; . + {($item.name): {dependencies:$item.dependencies,devDependencies:$item.devDependencies }} )' | prettyoutput --indent 3
# Exit on first error, print all commands.
set -e

# Grab the parent (root) directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

BIN=${DIR}/node_modules/.bin

echo "Scanning all the node modules starting at "${DIR}
#echo "Needs to have had  npm install -g npm -g install licensecheck"

rm -f "${DIR}/license-raw.txt"
touch "${DIR}/license-raw.txt"
rm -f "${DIR}/license-full.txt"
touch "${DIR}/license-full.txt"



ls -d "${DIR}"/packages/* | while read dirname
do
  cd "${dirname}"
  ${BIN}/licensecheck --tsv >>  "${DIR}/license-raw.txt"
  ${BIN}/licensecheck >> "${DIR}/license-full.txt"
  echo "-------------------------------------------" >> "${DIR}/license-full.txt"

done

exit