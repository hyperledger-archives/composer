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

const List = require ('./lib/list.js');

module.exports.command = 'list';
module.exports.describe = 'List all business network cards';
module.exports.builder = {
    name: {alias: 'n', required: false, describe: 'The name used to identify the card', type: 'string' }
};

module.exports.handler = (argv) => {
    return argv.thePromise = List.handler(argv);
};
