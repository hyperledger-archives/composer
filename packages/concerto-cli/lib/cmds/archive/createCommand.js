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

const Create = require ('./lib/create.js');

module.exports.command = 'create [options]';
module.exports.describe = 'Create the details of a Business Network Archive';
module.exports.builder = function (yargs){

    return yargs.option('archiveFile',{alias: 'a', required: false, describe: 'Business network archive file name. Default is based on the Identifier of the BusinessNetwork', type: 'string' })
            .option('inputDir',{alias: 'd', required: false, describe: 'Location to create the archive from e.g. NPM module directory'})
            .option('moduleName',{alias: 'm', required: false, describe: 'Name of the npm module to use '})
            .conflicts('inputDir','moduleName')
            .epilog('Only one of either inputDir or moduleName must be specified.');
};


module.exports.handler = (argv) => {

    return Create.handler(argv)
    .then(() => {
        console.log ('Command completed successfully.');
        process.exit(0);
    })
    .catch((error) => {
        console.log(error+ '\nCommand failed.');
        process.exit(1);
    });
};
