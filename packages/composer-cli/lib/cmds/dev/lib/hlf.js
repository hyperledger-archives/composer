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
 *
 *
 *
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

    /**
    *  @param {Array} argv command arguments
    *  @return {int} error code
    */
    static runCmd(argv){
        let dir = path.dirname(require.resolve('./hlf.js'));

        let composeYML = path.resolve(dir,'..','scripts','docker-compose.yml');
        let cmdString;
        let errorCode = 0;
        if (argv.start){
            cmdString = 'docker-compose -f '+composeYML+' up -d --build ';
            errorCode = shell.exec(cmdString).code;
        } else if (argv.stop){
            cmdString = 'docker-compose -f '+composeYML+' stop ';
            errorCode =  shell.exec(cmdString);
        } else if (argv.download){
          /*
          # Pull and tag the latest Hyperledger Fabric base image.
          docker pull hyperledger/fabric-baseimage:x86_64-0.1.0
          docker tag hyperledger/fabric-baseimage:x86_64-0.1.0 hyperledger/fabric-baseimage:latest
          */
            console.log('Pulling down Hyperledger Fabric Docker images');
            cmdString = 'docker pull hyperledger/fabric-baseimage:x86_64-0.1.0';
            errorCode = shell.exec(cmdString);

            cmdString = 'docker tag hyperledger/fabric-baseimage:x86_64-0.1.0 hyperledger/fabric-baseimage:latest';
            errorCode = shell.exec(cmdString);
        } else if (argv.delete){
          // todo put prompt here
          /*docker-compose kill && docker-compose down
          */
            console.log('Killing and stoping Hypledger Fabric docker containers');
            cmdString = ['docker-compose','-f',composeYML,'kill && docker-compose','-f',composeYML,'down'].join(' ');
            errorCode = shell.exec(cmdString);
        }

        if (argv.purgeProfiles && errorCode === 0){
            console.log('Deleting the default connection profile');
            errorCode = shell.rm('-rf','~/.composer-connection-profiles/defaultProfile');
            errorCode = (errorCode===0) ? shell.rm('-r','~/.composer-credentials/*') : errorCode;
        }

        return errorCode;
    }
}

module.exports = hlf;
