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
        let dir;
        let scripts;
        path.dirname(require.resolve('./hlfv1.js'));
        scripts = 'hlfv1';

        let errorCode = 0;
        if (argv.start){

            console.log('Creating Composer connection profile');
            let createProfile = path.resolve(dir,'..',scripts,'createProfile.sh');
            errorCode = this._cmd(createProfile);

            console.log('Starting Hyperledger Fabric v1.0');
            let startHLF = path.resolve(dir,'..',scripts,'start-hyperledger.sh');
            this._cmd(startHLF);
        } else if (argv.stop){
            console.log('Stopping Hyperledger Fabric');
            errorCode =  this._cmd(path.resolve(dir,'..',scripts,'stop-hyperledger.sh'));
        } else if (argv.download){
            console.log('Downloading Docker images Hyperledger Fabric');
            errorCode =  this._cmd(path.resolve(dir,'..',scripts,'download-hyperledger.sh'));
        } else if (argv.teardown){
            console.log('Killing and stoping Hypledger Fabric docker containers');
            console.log('Downloading Docker images Hyperledger Fabric');
            errorCode =  this._cmd(path.resolve(dir,'..',scripts,'teardown.sh'));
        } else if (argv.list){
            let shell = require('shelljs');
            let files = shell.ls(path.resolve(dir,'..',scripts));

            console.log(chalk.blue('\nScripts to control Fabric v1.0 are in ')+path.resolve(dir,'..',scripts));
            console.log(files.join('\n'));

            // let marked = require('marked');
            // let TerminalRenderer = require('marked-terminal');
            //
            // marked.setOptions({
            //               // Define custom renderer
            //     renderer: new TerminalRenderer()
            // });

            let readmefile = path.resolve(dir,'..',scripts,'README.md');
            let text = fs.readFileSync(readmefile,'utf8');
            console.log ('\n> cat '+readmefile+'\n'+(text));
            // console.log ('\n> cat '+readmefile+'\n'+marked(text));
        }

        return errorCode;
    }
}

module.exports = hlf;
