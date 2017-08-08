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

const Enroll = require ('./lib/enroll.js');

module.exports.command = 'enroll [options]';
module.exports.describe = 'Enroll an identity to download the certificate and key';
module.exports.builder = {
    connectionProfileName: {alias: 'p', required: true, describe: 'The connection profile name', type: 'string' },
    enrollId: { alias: 'i', required: true, describe: 'The enrollment ID of the user', type: 'string' },
    enrollSecret: { alias: 's', required: false, describe: 'The enrollment secret of the user', type: 'string' },
    path: { alias: 'd', required: false, describe: 'path where to store stuff', type: 'string' }
};

module.exports.handler = (argv) => {
    return argv.thePromise = Enroll.handler(argv);
};
