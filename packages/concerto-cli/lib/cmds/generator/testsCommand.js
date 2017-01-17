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

const Test = require ('./lib/tests.js');

module.exports.command = 'tests [options]';
module.exports.describe = 'Generate unit tests';
module.exports.builder = {
    projectDir: {alias: 'd', required: true, describe: 'The directory of your your concerto project', type: 'string' },
    networkArchiveLocation: {alias: 'a', required: true, describe: 'The location of the network archive zip file', type: 'string' },
    testDirName: {alias: 't', required: false, describe: 'The name of the projects test directory', type: 'string' },
    enrollId: { alias: 'i', required: true, describe: 'The enrollment ID of the user', type: 'string' },
    enrollSecret: { alias: 's', required: false, describe: 'The enrollment secret of the user', type: 'string' }
};
module.exports.handler = (argv) => {

    return Test.handler(argv)
    .then(() => {
        console.log ('Command completed successfully.');
        process.exit(0);
    })
    .catch((error) => {
        console.log(error);
        console.log('Command failed.');
        process.exit(1);
    });
};
