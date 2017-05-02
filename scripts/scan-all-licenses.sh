#!/bin/bash

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