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

const Start = require ('./lib/start.js');

module.exports.command = 'start [options]';
module.exports.describe = 'Starts a business network';
module.exports.builder = {
    archiveFile: {alias: 'a', required: true, describe: 'The business network archive file name', type: 'string' },
    connectionProfileName: {alias: 'p', required: true, describe: 'The connection profile name', type: 'string' },
    loglevel: { alias: 'l', required: false, describe: 'The initial loglevel to set (INFO|WARNING|ERROR|DEBUG)', type: 'string' },
    option: { alias: 'o', required: false, describe: 'Options that are specific specific to connection. Multiple options are specified by repeating this option', type: 'string' },
    optionsFile: { alias: 'O', required: false, describe: 'A file containing options that are specific to connection', type: 'string' },
    startId: { alias: 'i', required: true, describe: 'The id of the user permitted to start a network', type: 'string' },
    startSecret: { alias: 's', required: false, describe: 'The secret of the user permitted to start a network, if required', type: 'string' }
};

module.exports.handler = (argv) => {
    return argv.thePromise = Start.handler(argv);
};
