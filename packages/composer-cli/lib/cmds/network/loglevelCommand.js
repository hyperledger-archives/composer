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

const logLevel = require ('./lib/loglevel.js');

module.exports.command = 'loglevel [options]';
module.exports.describe = 'Change the logging level of a business network';
module.exports.builder = {
    businessNetworkName: {alias: 'n', required: true, describe: 'The business network name', type: 'string' },
    connectionProfileName: {alias: 'p', required: true, describe: 'The connection profile name', type: 'string' },
    newlevel: { alias: 'l', optional: true, describe: 'the new logging level (INFO/WARNING/ERROR/DEBUG)', type: 'string'/*, choices : ['INFO', 'WARNING', 'ERROR', 'DEBUG'] */},
    enrollId: { alias: 'i', required: true, describe: 'The enrollment ID of the user', type: 'string' },
    enrollSecret: { alias: 's', required: false, describe: 'The enrollment secret of the user', type: 'string' }
};

module.exports.handler = (argv) => {

    argv.thePromise =  logLevel.handler(argv)
    .then(() => {

        return;
    })
    .catch((error) => {
        throw error;

    });
    return argv.thePromise;
};
