#!/bin/bash

# Exit on first error, print all commands.
set -e

# Grab the Concerto directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

echo "Scanning all the node modules starting at "${DIR}
echo "Needs to have had  npm install -g npm -g install licensecheck"

rm -f "${DIR}/license-raw.txt"
touch "${DIR}/license-raw.txt"

ls -d "${DIR}"/packages/* | while read dirname

#for dirname in composer-admin composer-connector-embedded	composer-connector-web composer-runtime-hlf	generator-composer composer-cli	composer-connector-hlf composer-loopback-connector composer-runtime-web composer-client	composer-connector-proxy composer-runtime	composer-systests	loopback-connector-composer composer-common	composer-connector-server	composer-runtime-embedded	composer-ui
do
  cd "${dirname}" && licensecheck --tsv >>  "${DIR}/license-raw.txt"
done

echo "... Summary of all the licenses in the Composer Monorepo"
cat "${DIR}/license-raw.txt" | cut -f2 | sort -u
