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

const IssueCard = require ('./lib/issuecard.js');

module.exports.command = 'issuecard [options]';
module.exports.describe = 'Issue a new identity in card form to a participant in a participant registry';
module.exports.builder = {
    card: {alias: 'c', required: false, describe: 'Name of the network card to use for issuing', type: 'string'},
    file: {alias: 'f', required: true, describe: 'The card file name for the new identity', type: 'string' },
    newUserId: { alias: 'u', required: true, describe: 'The user ID for the new identity', type: 'string' },
    participantId: { alias: 'a', required: true, describe: 'The particpant to issue the new identity to', type: 'string' },
    issuer: { alias: 'x', required: true, describe: 'If the new identity should be able to issue other new identities', type: 'boolean' },
    option: { alias: 'o', required: false, describe: 'Options that are specific specific to connection. Multiple options are specified by repeating this option', type: 'string' },
    optionsFile: { alias: 'O', required: false, describe: 'A file containing options that are specific to connection', type: 'string' }
};

module.exports.handler = (argv) => {
    return argv.thePromise = IssueCard.handler(argv);
};
