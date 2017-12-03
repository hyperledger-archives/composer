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

const Submit = require ('./lib/submit.js');

module.exports.command = 'submit [options]';
module.exports.describe = 'Submit a transaction to a business network';
module.exports.builder = {
    data: { alias: 'd', required: true, describe: 'Transactions JSON object as a string', type: 'string' },
    card: { alias: 'c', required: true, description: 'The cardname to use to connect to the network', type:'string'}
};

module.exports.handler = (argv) => {
    return argv.thePromise =  Submit.handler(argv);
};
