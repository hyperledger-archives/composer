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

module.exports.command = 'list [options]';
module.exports.describe = 'Lists details of a Business Network Archive';
module.exports.builder = function (yargs){

    return yargs.option('archiveFile',{alias: 'a', required: false, describe: 'Business network archive file name.', type: 'string' });
};


module.exports.handler = (argv) => {

    argv.thePromise =  List.handler(argv)
    .then(() => {
        console.log ('Command completed successfully.');
    })
    .catch((error) => {
        console.log(error+ '\nCommand failed.');
    });
    return argv.thePromise;
};
