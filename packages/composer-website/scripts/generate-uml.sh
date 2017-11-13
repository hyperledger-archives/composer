#!/bin/bash

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
