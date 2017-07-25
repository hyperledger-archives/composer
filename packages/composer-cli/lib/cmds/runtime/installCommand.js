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

const Install = require ('./lib/install.js');

module.exports.command = 'install [options]';
module.exports.describe = 'Installs the Hyperledger Composer runtime for a business network to the Hyperledger Fabric';
module.exports.builder = {
    businessNetworkName: {alias: 'n', required: true, describe: 'The business network name', type: 'string' },
    connectionProfileName: {alias: 'p', required: true, describe: 'The connection profile name', type: 'string' },
    option: { alias: 'o', required: false, describe: 'Options that are specific specific to connection. Multiple options are specified by repeating this option', type: 'string' },
    optionsFile: { alias: 'O', required: false, describe: 'A file containing options that are specific to connection', type: 'string' },
    installId: { alias: 'i', required: true, describe: 'The id of the user permitted to install the runtime', type: 'string' },
    installSecret: { alias: 's', required: false, describe: 'The secret of the user permitted to install the runtime, if required', type: 'string' }
};

module.exports.handler = (argv) => {
    argv.thePromise =  Install.handler(argv)
    .then(() => {
        return;
    })
    .catch((error) => {
        throw error;

    });

    return argv.thePromise;
};
