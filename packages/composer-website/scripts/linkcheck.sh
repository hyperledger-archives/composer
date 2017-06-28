#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

npm install -g asciify

npm run jekyllserve > jekyll.log 2>&1 &
JOBN=$(jobs | awk '/jekyllserve/ { match($0,/\[([0-9]+)\]/,arr); print arr[1];  }')
sleep 10

echo Startin linkchecking...
linkchecker --ignore-url=jsdoc http://127.0.0.1:4000/composer/ -F text/UTF8/${DIR}/linkresults.txt 
if [ "$?" != "0" ]; then
	asciify '!!Broken Links!!' -f standard 
	cat ${DIR}/linkresults.txt

  # set the links as being broken.
  # need to ignore the jsdoc somehow for the momeny
fi
kill %${JOB}
jobs