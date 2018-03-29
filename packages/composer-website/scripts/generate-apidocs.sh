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

# Grab the Composer directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

# start index higher to allow for extras such as a class index. 
INDEX=1210

# rely on the parsejs tool (that is used to check the external API) to get the suitable classes
node ${DIR}/../composer-common/lib/codegen/parsejs.js --format JSON --inputDir ${DIR}/../composer-client/lib  --outputDir ${DIR}/jsondata
node ${DIR}/../composer-common/lib/codegen/parsejs.js --format JSON --inputDir ${DIR}/../composer-admin/lib  --outputDir ${DIR}/jsondata
node ${DIR}/../composer-common/lib/codegen/parsejs.js --format JSON --inputDir ${DIR}/../composer-runtime/lib/api  --outputDir ${DIR}/jsondata
node ${DIR}/../composer-common/lib/codegen/parsejs.js --format JSON --inputDir ${DIR}/../composer-common/lib  --outputDir ${DIR}/jsondata
node ${DIR}/../composer-common/lib/codegen/parsejs.js --format JSON --single ${DIR}/../composer-runtime/lib/api.js  --outputDir ${DIR}/jsondata
cd ${DIR}
node ./scripts/merge.js

# for each json file process using the class template
for file in ${DIR}/jsondata/*.json
do
  echo "${file}"
  BASENAME="$(basename -s .json ${file})"
  ((INDEX++))
  ${DIR}/apigen-opus/bin/cli1.js -i jsondata/${BASENAME} -t class.njk -o ${DIR}/jekylldocs/api --context "{\"index\":\"${INDEX}\"}"
done

# TODO, create the template a class index.
# This can be done by merging the json data from each class, and using a different template

${DIR}/apigen-opus/bin/cli1.js -i allData -t classindex.njk -o ${DIR}/jekylldocs/api --context "{\"index\":\"1205\"}"


# Copy the Main index doc into place

cp ${DIR}/scripts/api-doc-index.md.tpl ${DIR}/jekylldocs/api/api-doc-index.md
# all done