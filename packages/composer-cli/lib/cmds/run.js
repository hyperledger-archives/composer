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

module.exports.command = 'run [options]';
module.exports.desc = 'Composer command to run scripts to help create local Hyperledger Fabric instances';
module.exports.builder = function (yargs){

    return yargs.option('dir',{alias: 'r', required: true,  describe: 'Which release of Hyperledger Fabric to use [ hlf | hlfv1 ]', type: 'string' , default:'hlfv1'})
            .option('download',{alias: 'd', required: false, describe:'Pulls and tags the latest version of the Hyperledger Fabric Docker images'})
            .option('start',{alias: 's', required: false, describe:'Configures and Starts the Hyperledger Fabric instance for a development use ONLY'})
            .option('stop',{alias: 'x', required: false, describe:'Stops the Hyperledger Fabric intstance, can be restarted with start'})
            .option('teardown',{alias: 't', required: false, describe:'Removes the Hyperledger Fabric instance and cleans up Composer connection profiles. (Cached Docker images not removed)'})
            // .option('purge', {alias: 'p', required: false, describe: 'Deletes the Composer default connection profiles'})
            .conflicts({'download':'stop','start':'stop','stop':'','delete':'start'})
            .option('list', {alias: 'l', required:false, describe: 'Shows the directory of the example Fabric control scripts '})
            .option('run', {alias: 'r', required:false, describe: 'runs the script name as an argurment to this options'})
            // .usage('composer run  --download \n  composer run  fabric --start')
            .group(['download','start','stop','teardown'],'Script Shortcuts')
            .group(['run','list','dir'],'Run Scripts')
            .demand(0)
            ;
};

module.exports.handler = (argv) => {
    let hlf;

    // console.log(argv);

    if (argv.dir === 'hlf'){
        console.log('Hyperledger Fabric v0.6 starting with default configuration for Composer development');
        hlf = require ('./dev/lib/scripts.js');
    } else {
        console.log('Hyperledger Fabric v1-alpha starting with default configuration for Composer development');
        hlf = require ('./dev/lib/hlfv1.js');
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
