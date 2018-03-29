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

# Check for the system tests.
case ${TEST_SUITE} in
system*)
    echo Not executing as running system tests.
    exit 0
    ;;
esac

echo $(date) Generating PlantUML source files for public and private APIs...
node ./node_modules/composer-common/lib/codegen/parsejs.js --format PlantUML --inputDir "$DIR/node_modules/composer-common/lib" --outputDir "$DIR/out/uml"
#node ./node_modules/composer-common/lib/codegen/parsejs.js --format PlantUML --private --inputDir "$DIR/node_modules/composer-common/lib" --outputDir "$DIR/out/uml-private"

node ./node_modules/composer-common/lib/codegen/parsejs.js --format PlantUML --inputDir "$DIR/node_modules/composer-client/lib" --outputDir "$DIR/out/uml"
#node ./node_modules/composer-common/lib/codegen/parsejs.js --format PlantUML --private --inputDir "$DIR/node_modules/composer-client/lib" --outputDir "$DIR/out/uml-private"

node ./node_modules/composer-common/lib/codegen/parsejs.js --format PlantUML --inputDir "$DIR/node_modules/composer-admin/lib" --outputDir "$DIR/out/uml"
#node ./node_modules/composer-common/lib/codegen/parsejs.js --format PlantUML --private --inputDir "$DIR/node_modules/composer-admin/lib" --outputDir "$DIR/out/uml-private"

echo $(date) Generating images for public and private APIs...
node ./node_modules/composer-common/lib/tools/plantumltoimage.js --inputDir "$DIR/out/uml" --outputDir "$DIR/jekylldocs/api/diagrams"
node ./node_modules/composer-common/lib/tools/plantumltoimage.js --inputDir "$DIR/out/uml" --outputDir "$DIR/jekylldocs/jsdoc/diagrams"
#node ./node_modules/composer-common/lib/tools/plantumltoimage.js --inputDir "$DIR/out/uml-private" --outputDir "$DIR/out/diagrams-private"
echo $(date) Processed UML files
