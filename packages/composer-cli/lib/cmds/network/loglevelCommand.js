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
    newlevel: { alias: 'l', optional: true, describe: 'the new logging level', type: 'string'},
    card: { alias: 'c', required: true, description: 'The cardname to use to change the log level the network', type:'string'},
    full: { alias: 'x', required: false, description: 'The full settings of the currently configured debug log', hidden: true},
};

module.exports.handler = (argv) => {
    return argv.thePromise = logLevel.handler(argv);
};
