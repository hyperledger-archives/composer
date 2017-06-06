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

const Import = require ('./lib/import.js');

module.exports.command = 'import [options]';
module.exports.describe = 'Import an identity to wallet defined by the connection profile';
module.exports.builder = {
    connectionProfileName: {alias: 'p', required: true, describe: 'The connection profile name', type: 'string' },
    userId: { alias: 'u', required: true, describe: 'The user ID for the new identity', type: 'string' },
    signerCertFile: { alias: 'c', required: true, describe: 'signerCert path', type: 'string' },
    keyFile: { alias: 'k', required: true, describe: 'key file', type: 'string' }
};

module.exports.handler = (argv) => {
    argv.thePromise =  Import.handler(argv)
    .then(() => {
        console.log ('Command completed successfully.');
    });
    return argv.thePromise;
};
