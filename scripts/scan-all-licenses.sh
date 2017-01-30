#!/bin/bash

# Exit on first error, print all commands.
set -e

# Grab the Concerto directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

echo "Scanning all the node modules starting at "${DIR}
echo "Needs to have had  npm install -g npm -g install licensecheck"

rm -f ${DIR}/license-raw.txt
touch ${DIR}/license-raw.txt

ls -d ${DIR}/packages/* | while read dirname

#for dirname in concerto-admin  concerto-client concerto-connector-embedded  concerto-connector-web  concerto-runtime-embedded  concerto-runtime-web concerto-cli concerto-common  concerto-connector-hlf       concerto-runtime        concerto-runtime-hlf       concerto-systests
do
  cd ${dirname} && licensecheck --tsv >>  ${DIR}/license-raw.txt
done

echo "... Summary of all the licenses in the Concerto Monorepo"
cat ${DIR}/license-raw.txt | cut -f2 | sort -u
