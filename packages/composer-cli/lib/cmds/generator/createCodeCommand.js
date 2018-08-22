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

const Create = require ('./lib/createCode.js');

module.exports.command = 'create [options]';
module.exports.describe = 'Create Code artifacts from Business Network Archive';
module.exports.builder = function (yargs){

    yargs.options(
        {
            'archiveFile':{alias: 'a', required: true,  describe: 'Business network archive file name. Default is based on the Identifier of the BusinessNetwork', type: 'string'},
            'format':{alias: 'f', required: true, describe: 'Format of code to generate: Java, Go (beta), PlantUML, Typescript (beta), JSONSchema, XmlSchema.'},
            'outputDir':{alias: 'o', required: true, describe:'Output Location'}
        }
    );


    yargs.usage('composer generator create --archiveFile digitialPropertyNetwork.bna --format Go --outputDir ./dev/go-app');
    return yargs;
};

module.exports.handler = (argv) => {
    return argv.thePromise = Create.handler(argv);
};
