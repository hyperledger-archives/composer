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

# Source this script to set up environment variables for Fabric Docker image versions.
# These environment variables are used in docker-compose.yaml configurations.

# Fabric base images (peer, orderer, ccenv, tools)
export FABRIC_BASE_VERSION=1.2.1

# Fabric CA
export FABRIC_CA_VERSION=1.2.1

# Third-party images (couchdb, kafka, zookeeper)
export FABRIC_THIRDPARTY_VERSION=0.4.10