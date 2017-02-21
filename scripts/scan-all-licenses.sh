#!/bin/bash

# Exit on first error, print all commands.
set -e

# Grab the Concerto directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

echo "Scanning all the node modules starting at "${DIR}
echo "Needs to have had  npm install -g npm -g install licensecheck"

rm -f "${DIR}/license-raw.txt"
touch "${DIR}/license-raw.txt"
rm -f "${DIR}/license-full.txt"
touch "${DIR}/license-full.txt"



ls -d "${DIR}"/packages/* | while read dirname
do
  cd "${dirname}" 
  licensecheck --tsv >>  "${DIR}/license-raw.txt"
  licensecheck >> "${DIR}/license-full.txt"
  echo "-------------------------------------------" >> "${DIR}/license-full.txt"
  	
done

exit