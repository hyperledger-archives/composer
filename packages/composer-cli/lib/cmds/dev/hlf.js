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

// const hlf = require ('./lib/hlf.js');

module.exports.command = 'fabric [options]';
module.exports.describe = 'Controls a local Hyperledger Fabric instance and related Composer profiles';
module.exports.builder = function (yargs){

    return yargs.option('release',{alias: 'r', required: false,  describe: 'Which release of Hyperledger Fabric to use [ 0.6 | 1.0 ], default 1.0', type: 'string', default :'0.6' })
            .option('download',{alias: 't', required: false, describe:'Pulls and tags the latest version of the Hyperledger Fabric Docker images'})
            .option('start',{alias: 's', required: false, describe:'Configures and Starts the Hyperledger Fabric instance for a development use ONLY'})
            .option('stop',{alias: 'e', required: false, describe:'Stops the Hyperledger Fabric intstance, can be restarted with start'})
            .option('delete',{alias: 'd', required: false, describe:'Removes the Hyperledger Fabric instance and cleans up Composer connection profiles. (Cached Docker images not removed)'})
            .option('purge', {alias: 'p', required: false, describe: 'Deletes the Composer default connection profiles'})
            .conflicts({'download':'stop','start':'stop','stop':'','delete':'start'})
            .usage('composer dev fabric --downloand --release 0.6  \n  composer dev fabric --start')
            ;

};

module.exports.handler = (argv) => {
    let hlf;

    if (argv.release === '0.6'){
        console.log('Hyperledger Fabric v0.6 starting with default configuration for Composer development');
        hlf = require ('./lib/hlf.js');
    } else {
        console.log('Hyperledger Fabric v1-alpha starting with default configuration for Composer development');
        hlf = require ('./lib/hlfv1.js');
    }

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
