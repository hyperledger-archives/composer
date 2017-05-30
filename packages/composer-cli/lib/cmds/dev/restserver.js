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

const rest = require ('./lib/rest.js');

module.exports.command = 'rest [options]';
module.exports.describe = 'Controls a the rest API server';
module.exports.builder = function (yargs){

    return yargs
    .wrap(null)
    .usage('Usage: $0 [options]')
    .option('p', { alias: 'connectionProfileName', describe: 'The connection profile name', type: 'string', default: process.env.COMPOSER_CONNECTION_PROFILE })
    .option('n', { alias: 'businessNetworkName', describe: 'The business network identifier', type: 'string', default: process.env.COMPOSER_BUSINESS_NETWORK })
    .option('i', { alias: 'enrollId', describe: 'The enrollment ID of the user', type: 'string', default: process.env.COMPOSER_ENROLLMENT_ID })
    .option('s', { alias: 'enrollSecret', describe: 'The enrollment secret of the user', type: 'string', default: process.env.COMPOSER_ENROLLMENT_SECRET })
    .option('N', { alias: 'namespaces', describe: 'Use namespaces if conflicting types exist', type: 'string', default: process.env.COMPOSER_NAMESPACES || 'always', choices: ['always', 'required', 'never'] })
    .option('P', { alias: 'port', describe: 'The port to serve the REST API on', type: 'number', default: process.env.COMPOSER_PORT || undefined })
    .option('S', { alias: 'security', describe: 'Enable security for the REST API', type: 'boolean', default: process.env.COMPOSER_SECURITY || false })
    .help('h')
    .alias('h', 'help');
};

module.exports.handler = (argv) => {

    argv.thePromise = rest.handler(argv)
    .then(() => {
        console.log ('Command completed successfully.');
        return;

    })
    .catch((error) => {
        console.log(error.stack);
        console.log(error+ '\nCommand failed.');
        return;
    });

    return argv.thePromise;

};
