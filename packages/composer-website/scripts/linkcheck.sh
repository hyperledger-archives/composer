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

set -v
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

if [ $# != 1 ]; then
    echo 'Arguments: <build-label>'
    echo 1
fi

cd ${DIR}/jekylldocs

"${DIR}/scripts/run-jekyll.sh" serve . "$1" --skip-initial-build > "${DIR}/jekyll.log" 2>&1 &

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
