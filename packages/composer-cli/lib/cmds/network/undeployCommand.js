/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const Undeploy = require ('./lib/undeploy.js');

module.exports.command = 'undeploy [options]';
module.exports.describe = 'Undeploys a BusinessNetworkDefinition from the Hyperledger Fabric.';
module.exports.builder = {
    card: { alias: 'c', required: true, description: 'The cardname to use to connect and undeploy the network', type:'string'}
};

module.exports.handler = (argv) => {
    return argv.thePromise = Undeploy.handler(argv);
};
