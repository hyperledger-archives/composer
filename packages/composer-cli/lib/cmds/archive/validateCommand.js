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

const MigrationChecker = require ('./lib/migrationchecker.js');


module.exports.command = 'validate [options]';
module.exports.describe = 'validate a Business Network Archive for migration';
module.exports.builder = function (yargs){

    yargs.options({
        'from': {alias: 'f', required: true, describe: 'BNA Archive filename migrating FROM', type: 'string' },
        'to': {alias: 't', required: true, describe:'BNA Archive file migrating TO', type:'string' },
    });
    yargs.usage('composer archive validate --from digitalPropertyNetwork-one.bna --to digitialPropertyNetwork-two.bna');

    return yargs;
};

module.exports.handler = (argv) => {
    return argv.thePromise = MigrationChecker.handler(argv);
};
