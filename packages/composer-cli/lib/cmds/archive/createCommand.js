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
module.exports.describe = 'Create a Business Network Archive';
module.exports.builder = function (yargs){

    return yargs.option('archiveFile',{alias: 'a', required: false,  describe: 'Business network archive file name. Default is based on the Identifier of the BusinessNetwork', type: 'string' })
            .option('sourceType',{alias: 't', required: true, describe:'The type of the input containg the files used to create the archive [ module | dir ]'})
            .option('sourceName',{alias: 'n', required: true, describe:'The Location to create the archive from e.g. NPM module directory or Name of the npm module to use'})
            .usage('composer archive create --archiveFile digitialPropertyNetwork.zip --sourceType module --sourceName digitalproperty-network');
};

module.exports.handler = (argv) => {
    return argv.thePromise = Create.handler(argv);
};
