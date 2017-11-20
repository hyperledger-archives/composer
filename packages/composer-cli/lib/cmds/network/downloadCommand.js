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

const Download = require ('./lib/download.js');

module.exports.command = 'download [options]';
module.exports.describe = 'Downloads a business network from the Hyperledger Fabric, does not undeploy';
module.exports.builder = {
    archiveFile: {alias: 'a', required: true, describe: 'The business network archive file name to write', type: 'string' },
    card: { alias: 'c', required: true, description: 'The cardname to use to download the network', type:'string'}
};

module.exports.handler = (argv) => {
    return argv.thePromise = Download.handler(argv);
};
