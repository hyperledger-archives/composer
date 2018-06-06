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

# Exit on first error, print all commands.
set -ev

# Grab the Composer directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"


${DIR}/node_modules/.bin/github-changes --owner fabric-composer --repository fabric-composer --between-tags v0.5.5...upcoming --auth --no-merges --date-format YYYY/MM/DD

cp ${DIR}/scripts/changelog-header.txt ${DIR}/jekylldocs/support/changelog.md && cat ${DIR}/CHANGELOG.md >> ${DIR}/jekylldocs/support/changelog.md
