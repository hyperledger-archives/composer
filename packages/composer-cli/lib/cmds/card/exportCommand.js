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

const Import = require ('./lib/export.js');

module.exports.command = 'export [options]';
module.exports.describe = 'Export a business network card';
module.exports.builder = {
    file: {alias: 'f', required: false, describe: 'The card file name', type: 'string' },
    card: {alias: 'c', required: true, describe: 'The name of the card to export', type: 'string' }
};

module.exports.handler = (argv) => {
    return argv.thePromise = Import.handler(argv);
};
