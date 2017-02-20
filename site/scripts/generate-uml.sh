#!/bin/bash

# Exit on first error, print all commands.
set -ev

# Grab the Concerto directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
ROOT="$( cd "${DIR}/.." && pwd   )"

#normalDir="`cd "${dirToNormalize}";pwd`"
echo "${ROOT}"

# Check for the system tests.
case ${TEST_SUITE} in
system*)
    echo Not executing as running system tests.
    exit 0
    ;;
esac

SRCPARSER=${ROOT}/packages/composer-common/lib/codegen/parsejs.js

echo $(date) Generating PlantUML source files for public and private APIs...
echo node ${SRCPARSER} --format PlantUML --inputDir "${ROOT}/packages/composer-common/lib" --outputDir "$DIR/out/uml"

node ${SRCPARSER} --format PlantUML --inputDir ${ROOT}/packages/composer-common/lib --outputDir "$DIR/out/uml"
#node ./node_modules/composer-common/lib/codegen/parsejs.js --format PlantUML --private --inputDir "$DIR/node_modules/composer-common/lib" --outputDir "$DIR/out/uml-private"

node ${SRCPARSER} --format PlantUML --inputDir "${ROOT}/packages/composer-client/lib" --outputDir "$DIR/out/uml"
#node ./node_modules/composer-common/lib/codegen/parsejs.js --format PlantUML --private --inputDir "$DIR/node_modules/composer-client/lib" --outputDir "$DIR/out/uml-private"

node ${SRCPARSER} --format PlantUML --inputDir "${ROOT}/packages/composer-admin/lib" --outputDir "$DIR/out/uml"
#node ./node_modules/composer-common/lib/codegen/parsejs.js --format PlantUML --private --inputDir "$DIR/node_modules/composer-admin/lib" --outputDir "$DIR/out/uml-private"

echo $(date) Generating images for public and private APIs...
node ${ROOT}/packages/composer-common/lib/tools/plantumltoimage.js --inputDir "$DIR/out/uml" --outputDir "$DIR/jekylldocs/jsdoc/diagrams"
#node ./node_modules/composer-common/lib/tools/plantumltoimage.js --inputDir "$DIR/out/uml-private" --outputDir "$DIR/out/diagrams-private"
echo $(date) Processed UML files
