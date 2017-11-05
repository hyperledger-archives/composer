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
    loglevel: { alias: 'l', required: false, describe: 'The initial loglevel to set', choices : ['INFO', 'WARNING', 'ERROR', 'DEBUG']},
    option: { alias: 'o', required: false, describe: 'Options that are specific specific to connection. Multiple options are specified by repeating this option', type: 'string' },
    optionsFile: { alias: 'O', required: false, describe: 'A file containing options that are specific to connection', type: 'string' },
    networkAdmin: { alias: 'A', required: false, description: 'The identity name of the business network administrator', type: 'string' },
    networkAdminCertificateFile: { alias: 'C', required: false, description: 'The certificate of the business network administrator', type: 'string' },
    networkAdminEnrollSecret: { alias: 'S', required: false, description: 'Use enrollment secret for the business network administrator', type: 'boolean', default: undefined },
    card: { alias: 'c', required: false, description: 'The cardname to use to start the network', type:'string'}
};

module.exports.handler = (argv) => {
    return argv.thePromise = Start.handler(argv);
};
