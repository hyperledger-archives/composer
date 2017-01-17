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

const Issue = require ('./lib/issue.js');

module.exports.command = 'issue [options]';
module.exports.describe = 'Issue an identity to a participant in a participant registry';
module.exports.builder = {
    connectionProfileName: {alias: 'p', required: false, describe: 'The connection profile name', type: 'string' },
    businessNetworkName: {alias: 'n', required: true, describe: 'The business network name', type: 'string' },
    enrollId: { alias: 'i', required: true, describe: 'The enrollment ID of the user', type: 'string' },
    enrollSecret: { alias: 's', required: false, describe: 'The enrollment secret of the user', type: 'string' },
    newUserId: { alias: 'u', required: true, describe: 'The user ID for the new identity', type: 'string' },
    participantId: { alias: 'a', required: true, describe: 'The particpant to issue the new identity to', type: 'string' },
    issuer: { alias: 'x', required: true, describe: 'If the new identity should be able to issue other new identities', type: 'boolean' }
};

module.exports.handler = (argv) => {

    return Issue.handler(argv)
    .then(() => {
        console.log ('Command completed successfully.');
        process.exit(0);
    })
    .catch((error) => {
        console.log(error+ '\nCommand failed.');
        process.exit(1);
    });
};
