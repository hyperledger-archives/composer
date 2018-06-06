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

const docs = require('composer-documentation');

module.exports.command = 'docs [options]';
module.exports.describe = 'Create HTML Documentation from a Business Network Archive';
module.exports.builder = function (yargs){

    yargs.options(
        {
            'archive':{alias: 'a', required: true,  describe: 'Business network archive file name. Default is based on the Identifier of the BusinessNetwork', type: 'string'},
            'config':{alias: 'c', required: false, default:'',describe: 'Path to the configuration file to use, default is one specificaly for BNA files'},
            'outdir':{alias: 'o', required: false,  default: './out', describe:'Output Location'}
        }
    );
    yargs.usage('composer generator docs --archiveFile digitialPropertyNetwork.bna');
    return yargs;
};

module.exports.handler = (argv) => {
    return argv.thePromise = docs(argv);
};
