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

const Delete = require ('./lib/delete.js');

module.exports.command = 'delete [options]';
module.exports.describe = 'Delete a business network card';
module.exports.builder = (yargs) => {
    yargs.options({
        card: { alias: 'c', required: true, describe: 'The name of the card to delete', type: 'string' }
    });

    yargs.requiresArg(['c']);

    return yargs;
};

module.exports.handler = (argv) => {
    return argv.thePromise = Delete.handler(argv);
};
