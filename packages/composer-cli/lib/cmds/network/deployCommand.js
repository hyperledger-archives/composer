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

const Deploy = require ('./lib/deploy.js');

module.exports.command = 'deploy [options]';
module.exports.describe = 'Deploys a business network to the Hyperledger Fabric';
module.exports.builder = {
    archiveFile: {alias: 'a', required: true, describe: 'The business network archive file name', type: 'string' },
    connectionProfileName: {alias: 'p', required: true, describe: 'The connection profile name', type: 'string' },
    enrollId: { alias: 'i', required: true, describe: 'The enrollment ID of the user', type: 'string' },
    loglevel: { alias: 'l', required: false, describe: 'The initial loglevel to set (INFO|WARNING|ERROR|DEBUG)', type: 'string' },
    option: { alias: 'o', required: false, describe: 'Options that are specific specific to connection. Multiple options are specified by repeating this option', type: 'string' },
    optionsFile: { alias: 'O', required: false, describe: 'A file containing options that are specific to connection', type: 'string' },
    enrollSecret: { alias: 's', required: false, describe: 'The enrollment secret of the user', type: 'string' },
    networkAdmin: { alias: 'A', required: false, description: 'The identity name of the business network administrator', type: 'string' },
    networkAdminCertificateFile: { alias: 'C', required: false, description: 'The certificate of the business network administrator', type: 'string' },
    networkAdminEnrollSecret: { alias: 'S', required: false, description: 'Use enrollment secret for the business network administrator', type: 'boolean' }
};

module.exports.handler = (argv) => {
    return argv.thePromise = Deploy.handler(argv);
};
