#!/bin/bash
set -v
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

cd ${DIR}/jekylldocs

if [ "$1" == "prod" ]; then
    jekyll serve --config _config.yml --skip-initial-build  > ${DIR}/jekyll.log 2>&1 &
elif [ "$1" == "unstable" ]; then
    jekyll serve --config _config.yml,_unstable.yml --skip-initial-build  > ${DIR}/jekyll.log 2>&1 & 
else
   echo "Script error"
   exit 1
fi

JOBN="$(jobs | awk '/jekyll serve/ { match($0,/\[([0-9]+)\]/,arr); print arr[1];  }')"
echo ${JOBN}

sleep 10
cat ${DIR}/jekyll.log
URL="$( cat ${DIR}/jekyll.log | awk '/Server address:/ { print $3 }')"

# set the return code for this script
RC=0

echo Starting linkchecking... ${URL}
linkchecker --ignore-url=jsdoc ${URL} -F text/UTF8/${DIR}/linkresults.txt 
if [ "$?" != "0" ]; then
	asciify '!!Broken Links!!' -f standard    
    cat ${DIR}/linkresults.txt    
    # return 1 to indicate the the build has failed
    RC=1

fi

# always show the file - includes number of links checked
cat ${DIR}/linkresults.txt

# clean up the running Jekyll server
kill %${JOBN}
sleep 1
jobs
echo Ending script with rc=${RC}
exit ${RC}