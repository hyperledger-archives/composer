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
            .option('download',{alias: 'd', required: false, describe:'Runs the script to pull the Hyperledger Fabric Docker images'})
            .option('createProfile',{alias: 'c', required: false, describe:'Run the createProfile script to create basic Composer Connection Profike'})
            .option('start',{alias: 's', required: false, describe:'Configures and Starts the Hyperledger Fabric instance for a development use'})
            .option('stop',{alias: 'x', required: false, describe:'Stops the Hyperledger Fabric intstance, can be restarted with start'})
            .option('teardown',{alias: 't', required: false, describe:'Removes the Hyperledger Fabric instance and cleans up Composer connection profiles. (Cached Docker images not removed)'})
            // .option('purge', {alias: 'p', required: false, describe: 'Deletes the Composer default connection profiles'})
            .conflicts({'download':'stop','start':'stop','stop':'','teardown':'start'})
            .option('list', {alias: 'l', required:false, describe: 'Shows the directory of the example Fabric control scripts '})
            // .option('run', {alias: 'r', required:false, describe: 'runs the script name as an argurment to this options'})
            .usage('Runs scripts to help control a Hyperledger Fabric for development use. ')
            .group(['download','start','stop','teardown','createProfile'],'Script Shortcuts')
            .group(['list','dir'],'List scripts and specify directory')
            .demand(0)
            ;
};

module.exports.handler = (argv) => {
    let hlf;

    // console.log(argv);
    // for safety, we create and then later use the resolveDir property.
    // don't want anybody running anything that shouldn't really be run
    if (argv.dir === 'hlf'){
        console.log('Hyperledger Fabric v0.6 starting with default configuration for Composer development');
        argv.resolveDir = 'scripts';
    } else {
        console.log('Hyperledger Fabric v1-alpha starting with default configuration for Composer development');
        argv.resolveDir = 'hlfv1';
    }

    hlf = require ('./dev/lib/hlfv1.js');

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
