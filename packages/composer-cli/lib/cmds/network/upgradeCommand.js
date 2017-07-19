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

const Upgrade = require ('./lib/upgrade.js');

module.exports.command = 'upgrade [options]';
module.exports.describe = 'Upgrades the Hyperledger Composer runtime of a business network';
module.exports.builder = {
    businessNetworkName: {alias: 'n', required: true, describe: 'The business network name whose runtime will be upgraded', type: 'string' },
    connectionProfileName: {alias: 'p', required: true, describe: 'The connection profile name', type: 'string' },
    installId: { alias: 'i', required: true, describe: 'The id of the user permitted to upgrade the runtime', type: 'string' },
    installSecret: { alias: 's', required: false, describe: 'The secret of the user permitted to upgrade the runtime, if required', type: 'string' }
};

module.exports.handler = (argv) => {
    argv.thePromise =  Upgrade.handler(argv)
    .then(() => {
        return;
    })
    .catch((error) => {
        throw error;

    });

    return argv.thePromise;
};
