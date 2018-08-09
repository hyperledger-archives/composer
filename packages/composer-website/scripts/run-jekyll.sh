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

if [ $# -lt 3 ]; then
    echo 'Arguments: <jekyll-command> <docs-dir> <build-label> [<jekyll-arg> ...]'
    exit 1
fi

JEKYLL_COMMAND="$1"
DOCS_DIR="$2"
BUILD_LABEL="$3"

# Set up Jekyll
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
"${SCRIPT_DIR}/setup-jekyll.sh"

# Write custom configuration for this build
JEKYLL_CONFIG="$(mktemp)".yaml
echo "baseurl: /composer/${BUILD_LABEL}" >> "${JEKYLL_CONFIG}"
echo "status: ${BUILD_LABEL}" >> "${JEKYLL_CONFIG}"

# Run Jekyll command
cd "${DOCS_DIR}" || exit 2
jekyll "${JEKYLL_COMMAND}" --config "_config.yml,${JEKYLL_CONFIG}" "${@:4}"

# Clean up custom configuration
rm -f "${JEKYLL_CONFIG}"
