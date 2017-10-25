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

const Add = require ('./lib/add.js');

module.exports.command = 'add [options]';
module.exports.describe = 'Add a new participant to a participant registry';
module.exports.builder = {
    connectionProfileName: {alias: 'p', required: false, describe: 'The connection profile name', type: 'string' },
    businessNetworkName: {alias: 'n', required: false, describe: 'The business network name', type: 'string' },
    enrollId: { alias: 'i', required: false, describe: 'The enrollment ID of the user', type: 'string' },
    enrollSecret: { alias: 's', required: false, describe: 'The enrollment secret of the user', type: 'string' },
    data: { alias: 'd', required: true, describe: 'Serialized participant JSON object as a string', type: 'string' },
    card: { alias: 'c', required: false, description: 'The cardname to use to download the network', type:'string'}
};

module.exports.handler = (argv) => {
    return argv.thePromise = Add.handler(argv);
};
