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

// enforces singletons
const checkFn = (argv,options) => {

    ['archiveFile','sourceType','sourceName'].forEach((e)=>{
        if (Array.isArray(argv[e])){
            throw new Error(`Option ${e} can only be specified once`);
        }
    });

    return true;
};
module.exports._checkFn = checkFn;
module.exports.command = 'create [options]';
module.exports.describe = 'Create a Business Network Archive';
module.exports.builder = function (yargs){

    yargs.options({
        'archiveFile' : {alias: 'a', required: false, describe: 'Business network archive file name. Default is based on the Identifier of the BusinessNetwork', type: 'string' },
        'sourceType'  : {alias: 't', required: true, describe:'The type of the input containing the files used to create the archive', choices: ['module','dir']},
        'sourceName'  : {alias: 'n', required: true, describe:'The Location to create the archive from e.g. NPM module directory or Name of the npm module to use'},
        'updateExternalModels'  : {alias: 'u', required: false, describe:'Downloads external model dependencies', type: 'boolean', default: false},
        'optionsFile': { alias: 'O', required: false, describe: 'A file containing options', type: 'string' }
    });
    yargs.usage('composer archive create --updateExternalModels --optionsFile myoptions.json --archiveFile digitialPropertyNetwork.zip --sourceType dir --sourceName ./digitalproperty-network');

    // enforce the option after these options
    yargs.requiresArg(['archiveFile','sourceType','sourceName']);

    // enforce singletons
    yargs.check(checkFn);

    return yargs;
};

module.exports.handler = (argv) => {
    return argv.thePromise = Create.handler(argv);
};

