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


const shell = require('shelljs');
const path = require('path');
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
        console.log('Running > '+cmdString);
        return shell.exec(cmdString).code;
    }


    /**
    *  @param {Array} argv command arguments
    *  @return {int} error code
    */
    static runCmd(argv){

        if (argv.start === undefined && argv.stop === undefined && argv.download===undefined && argv.delete === undefined && argv.purgeProfiles === undefined){
            return this._cmd('docker ps');
        }

        let dir = path.dirname(require.resolve('./hlf.js'));

        let composeYML = path.resolve(dir,'..','scripts','docker-compose.yml');
        let cmdString;
        let errorCode = 0;
        if (argv.start){
            console.log('Starting Hyperledger Fabric');
            cmdString = 'docker-compose -f '+composeYML+' up -d --build ';
            errorCode = this._cmd(cmdString);
        } else if (argv.stop){
            console.log('Stopping Hyperledger Fabric');
            cmdString = 'docker-compose -f '+composeYML+' stop ';
            errorCode =  this._cmd(cmdString);

        } else if (argv.download){
          /*
          # Pull and tag the latest Hyperledger Fabric base image.
          docker pull hyperledger/fabric-baseimage:x86_64-0.1.0
          docker tag hyperledger/fabric-baseimage:x86_64-0.1.0 hyperledger/fabric-baseimage:latest
          */
            console.log('Pulling down Hyperledger Fabric Docker images');
            cmdString = 'docker pull hyperledger/fabric-baseimage:x86_64-0.1.0';
            errorCode = this._cmd(cmdString);

            cmdString = 'docker tag hyperledger/fabric-baseimage:x86_64-0.1.0 hyperledger/fabric-baseimage:latest';
            errorCode = this._cmd(cmdString);

        } else if (argv.delete){
          // todo put prompt here
          /*docker-compose kill && docker-compose down
          */
            console.log('Killing and stoping Hypledger Fabric docker containers');
            cmdString = ['docker-compose','-f',composeYML,'kill && docker-compose','-f',composeYML,'down'].join(' ');

            errorCode = this._cmd(cmdString);

        }

        if (argv.purgeProfiles && errorCode === 0){
            console.log('Deleting the default connection profile');

            errorCode = shell.rm('-rf','~/.composer-connection-profiles/defaultProfile').code;
            errorCode = (errorCode===0) ? shell.rm('-r','~/.composer-credentials/*').code : errorCode;

        }

        return errorCode;
    }
}

module.exports = hlf;
