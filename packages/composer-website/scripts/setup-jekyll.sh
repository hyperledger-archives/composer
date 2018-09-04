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

echo "Attempting to install jekyll"
gem install sass:3.4.25 jekyll
echo "Attempting to install jekyll-sitemap"
gem install jekyll-sitemap
echo "Attempting to install redcarpet"
gem install redcarpet

echo "Jekyll Installed"
