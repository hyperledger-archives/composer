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

const hlf = require ('./lib/hlf.js');

module.exports.command = 'hlf [options]';
module.exports.describe = 'Controls a local HLF instance';
module.exports.builder = function (yargs){

    return yargs.option('hlfversion',{alias: 'h', required: false,  describe: 'Which version of HLF to start [ 0.6 | 1.0 ], defualt 0.6', type: 'string', default :'0.6' })
            .option('download',{alias: 't', required: false, describe:'Pulls and tags the latest version of the HLF docker images'})
            .option('start',{alias: 's', required: false, describe:'Starts the HLF instance for a developmnet use'})
            .option('stop',{alias: 'e', required: false, describe:'Stops the HLF intstance, can be restarted'})
            .option('delete',{alias: 'd', required: false, describe:'Removes the HLF instance and cleans up Composer conneciton profiles. (Cached Docker images not removed)'})
            .option('purgeProfiles', {alias: 'p', required: false, describe: 'Deletes the Composer Default connection profiles'})
            .conflicts({'download':'stop','start':'stop','stop':'','delete':'start'})
            .usage('composer dev hlf --downloand --hlfversion 0.6  \n  composer dev hlf --start')
            ;

};

module.exports.handler = (argv) => {

    argv.thePromise = hlf.handler(argv)
    .then(() => {
        console.log ('Command completed successfully.');
        return (0);
    })
    .catch((error) => {
        console.log(error.stack);
        console.log(error+ '\nCommand failed.');
        return (1);
    });
    return argv.thePromise;

};
