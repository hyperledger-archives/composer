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

const Ping = require ('./lib/ping.js');

module.exports.command = 'ping [options]';
module.exports.describe = 'Test a connection to a business network';
module.exports.builder = {
    card: { alias: 'c', required: true, description: 'The cardname to use to ping the network', type:'string'}
};

module.exports.handler = (argv) => {
    return argv.thePromise = Ping.handler(argv);
};
