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

## this is a script soley for inclusion in the main build scripts. 
## Common functions that are executed both all types of builds

ME=`basename "$0"`
echo "-->-- Starting ${ME}"
echo "--I-- ${TRAVIS_TAG} ${TRAVIS_BRANCH}"

LATEST_RELEASE_VERSION='v0.20'

function _exit(){
    printf "%s Exiting %s because %s exit code:%s\n" "--<--" "${ME}" "$1" "$2"   
    exit $2
}

function _abortBuild(){
    echo "ABORT_BUILD=true" > ${DIR}/build.cfg
    echo "ABORT_CODE=$1" >> ${DIR}/build.cfg
    echo "BUILD_FOCUS=${BUILD_FOCUS}" >> ${DIR}/build.cfg
    echo "BUILD_RELEASE=${BUILD_RELEASE}" >> ${DIR}/build.cfg
}

#check to see if the build.cfg file (that holds state between scripts)
if [ ! -f ${DIR}/build.cfg ]; then

    echo "ABORT_BUILD=false" > ${DIR}/build.cfg
    echo "ABORT_CODE=0" >> ${DIR}/build.cfg

    VALID_BRANCH_REGEXP='^v([0-9]+\.){2}([0-9]+|x)'
    if [[ "${TRAVIS_BRANCH}" =~ ${VALID_BRANCH_REGEXP} ]]; then
        # Use first two digits of branch, e.g. v0.20
        BUILD_FOCUS="$(echo "${TRAVIS_BRANCH}" | cut -d . -f -2)"
        [[ "${BUILD_FOCUS}" == "${LATEST_RELEASE_VERSION}" ]] && BUILD_FOCUS='latest'
    else
        # Default to 'latest' to maintain previous bahaviour
        BUILD_FOCUS='latest'
    fi

    if [ -z "${TRAVIS_TAG}" ]; then
        BUILD_RELEASE='unstable'
    else
        BUILD_RELEASE='stable'
    fi


    echo "BUILD_FOCUS=${BUILD_FOCUS}" >> ${DIR}/build.cfg
    echo "BUILD_RELEASE=${BUILD_RELEASE}" >> ${DIR}/build.cfg
fi

source ${DIR}/build.cfg

echo "--I-- Build focus is ${BUILD_FOCUS}"
echo "--I-- Build release is ${BUILD_RELEASE}"

if [ "${ABORT_BUILD}" == "true" ]; then
  _exit "exiting early from" ${ABORT_CODE}
fi