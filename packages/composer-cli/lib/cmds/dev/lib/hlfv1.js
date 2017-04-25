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
const fs = require('fs');

const shell = require('shelljs');
const path = require('path');
const chalk = require('chalk');
/**
 * Composer dev hlf command

 * @private
 */
class hlf {

    /**
    * Command process for deploy command
    * @param {string} argv argument list from composer command

    * @return {Promise} resolved when command has completed
    */
    static handler(argv) {

        let hlfCmdPromise = new Promise(
        function (resolve, reject) {

            if (hlf.runCmd(argv)===0) {
                resolve(0); // fulfilled
            } else {
                reject(1); // reject
            }

        }
      );

        return hlfCmdPromise;

    }


    /** @private
     * @param {String} cmdString The command string to run
     * @return {int} error code
     */
    static _cmd(cmdString){
        console.log(chalk.blue('Running > ')+cmdString);
        return shell.exec(cmdString).code;
    }


    /**
    *  @param {Array} argv command arguments
    *  @return {int} error code
    */
    static runCmd(argv){

        if (argv.scripts === undefined && argv.start === undefined && argv.stop === undefined && argv.download===undefined && argv.delete === undefined && argv.purgeProfiles === undefined){
            return this._cmd('docker ps');
        }

        let dir;
        let scripts;
        if (argv.release === '0.6'){
            dir = path.dirname(require.resolve('./hlf.js'));
            scripts = 'scripts';
        } else {
            dir = path.dirname(require.resolve('./hlfv1.js'));
            scripts = 'hlfv1';
        }



        let composeYML = path.resolve(dir,'..',scripts,'hlfv1_alpha-docker-compose.yml');
        let cmdString;
        let errorCode = 0;
        if (argv.start){

            console.log('Creating Composer connection profile');
            let createProfile = path.resolve(dir,'..',scripts,'createProfile.sh');
            errorCode = this._cmd(createProfile);

            console.log('Starting Hyperledger Fabric v1.0');
            let startHLF = path.resolve(dir,'..',scripts,'start-hyperledger.sh');
            this._cmd(startHLF);

            // let createProfile = path.resolve(dir,'..',scripts,'createProfile.sh');
            // let createChannel = path.resolve(dir,'..',scripts,'create-channel.js');
            // let joinChannel = path.resolve(dir,'..',scripts,'join-channel.js');
            //
            // cmdString = 'docker-compose -f '+composeYML+' up -d  ';
            //
            // console.log('Creating Composer connection profile');
            // errorCode = this._cmd(createProfile);
            // errorCode = (errorCode===0) ? this._cmd(cmdString) : errorCode;
            //
            // this._cmd('/bin/sleep 15');
            //
            // console.log('Creating default channel and organization');
            // this._cmd('node '+createChannel);
            // this._cmd('node '+joinChannel);


        } else if (argv.stop){
            console.log('Stopping Hyperledger Fabric');
            cmdString = 'docker-compose -f '+composeYML+' stop ';
            errorCode =  this._cmd(cmdString);

        } else if (argv.download){

            let dockerImages = [ 'docker pull hyperledger/fabric-peer:x86_64-1.0.0-alpha',
                'docker pull hyperledger/fabric-ca:x86_64-1.0.0-alpha',
                'docker pull hyperledger/fabric-ccenv:x86_64-1.0.0-alpha',
                'docker pull hyperledger/fabric-orderer:x86_64-1.0.0-alpha',
                'docker pull hyperledger/fabric-couchdb:x86_64-1.0.0-alpha'];
            console.log('Pulling down Hyperledger Fabric Docker images');
            dockerImages.forEach(function(cmdString){
                this._cmd(cmdString);
            },this );


        } else if (argv.delete){
          // todo put prompt here
          /*docker-compose kill && docker-compose down
          */
            console.log('Killing and stoping Hypledger Fabric docker containers');
            cmdString = ['docker-compose','-f',composeYML,'kill && docker-compose','-f',composeYML,'down'].join(' ');

            errorCode = this._cmd(cmdString);

        } else if (argv.scripts){
            let shell = require('shelljs');
            let files = shell.ls(path.resolve(dir,'..',scripts));

            console.log(chalk.blue('\nScripts to control Fabric v1.0 are in ')+path.resolve(dir,'..',scripts));
            console.log(files.join('\n'));


            let marked = require('marked');
            let TerminalRenderer = require('marked-terminal');

            marked.setOptions({
                          // Define custom renderer
                renderer: new TerminalRenderer()
            });

            let readmefile = path.resolve(dir,'..',scripts,'README.md');
            let text = fs.readFileSync(readmefile,'utf8');
            console.log ('\n> cat '+readmefile+'\n'+marked(text));
        }

        if (argv.purgeProfiles && errorCode === 0){
            console.log('Deleting the default connection profile');

            errorCode = shell.rm('-rf','~/.composer-connection-profiles/hlfv1').code;
            errorCode = (errorCode===0) ? shell.rm('-r','~/.hfc-key-store/*').code : errorCode;



        }

        return errorCode;
    }
}

module.exports = hlf;
