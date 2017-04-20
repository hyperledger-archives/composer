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


// const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
const cmdUtil = require('../../utils/cmdutils');
const fs = require('fs');
const homedir = require('homedir');
// const cmdUtil = require('../../utils/cmdutils');
const sanitize = require('sanitize-filename');
const PROFILE_ROOT = homedir() + '/.composer-connection-profiles/';
const CONNECTION_FILE = 'connection.json';

const CREDENTIALS_ROOT = homedir() + '/.composer-credentials';
const DEFAULT_PROFILE_NAME = 'defaultProfile';

const ora = require('ora');
const chalk = require('chalk');

let businessNetworkConnection ;
/**
 * <p>
 * Composer deploy command
 * </p>
 * <p><a href="diagrams/Deploy.svg"><img src="diagrams/deploy.svg" style="width:100%;"/></a></p>
 * @private
 */
class Download {

  /**
    * Command process for deploy command
    * @param {string} argv argument list from composer command
    * @param {boolean} updateOption true if the network is to be updated
    * @return {Promise} promise when command complete
    */
    static handler(argv) {


        let businessNetworkDefinition;
        let businessNetworkName;
        let spinner;

        businessNetworkConnection = cmdUtil.createBusinessNetworkConnection();

        return (() => {


            if (!argv.enrollSecret) {
                return cmdUtil.prompt({
                    name: 'enrollmentSecret',
                    description: 'What is the enrollment secret of the user?',
                    required: true,
                    hidden: true,
                    replace: '*'
                })
                .then((result) => {
                    argv.enrollSecret = result;
                });
            } else {
                return Promise.resolve();
            }
        })()
        .then (() => {
            spinner = ora('Downloading deployed Business Network Archive').start();
            return businessNetworkConnection.connect(Download.getDefaultProfileName(argv), argv.businessNetworkName, argv.enrollId, argv.enrollSecret)
                .then((result) => {
                    businessNetworkDefinition = result;
                    return businessNetworkConnection.disconnect();
                });
        })
        .then (() => {
            spinner.succeed();
            businessNetworkName = businessNetworkDefinition.getIdentifier();
            console.log(chalk.blue.bold('Business network definition:'));
            console.log(chalk.blue('\tIdentifier: ')+businessNetworkName);
            console.log(chalk.blue('\tDescription: ')+businessNetworkDefinition.getDescription());
            console.log();

            if (!argv.archiveFile){
                argv.archiveFile = sanitize(businessNetworkName,{replacement:'_'})+'.bna';
            }
          // need to write this out to the required file now.
            return businessNetworkDefinition.toArchive();
        }).then ( (result) => {
            //write the buffer to a file
            fs.writeFileSync(argv.archiveFile,result);
            console.log(chalk.blue.bold('\nWritten Business Network Definition Archive file to: ')+argv.archiveFile);

        }).catch( (error) => {
            console.log(error);

            if (spinner) {
                spinner.fail();
            }

            throw error;
        })
        ;
    }

    /**
      * Get connection options from profile
      * @param {string} connectionProfileName connection profile name
      * @return {connectOptions} connectOptions options
      */
    static getConnectOptions(connectionProfileName) {

        let connectOptions;
        let connectionProfile = PROFILE_ROOT + connectionProfileName + '/' + CONNECTION_FILE;
        if (fs.existsSync(connectionProfile)) {
            let connectionProfileContents = fs.readFileSync(connectionProfile);
            connectOptions = JSON.parse(connectionProfileContents);
        } else {
            let defaultKeyValStore = CREDENTIALS_ROOT;

            connectOptions = {type: 'hlf'
                             ,membershipServicesURL: 'grpc://localhost:7054'
                             ,peerURL: 'grpc://localhost:7051'
                             ,eventHubURL: 'grpc://localhost:7053'
                             ,keyValStore: defaultKeyValStore
                             ,deployWaitTime: '300'
                             ,invokeWaitTime: '100'};
        }
        return connectOptions;
    }

    /**
      * Get default profile name
      * @param {argv} argv program arguments
      * @return {String} defaultConnection profile name
      */
    static getDefaultProfileName(argv) {
        return argv.connectionProfileName || DEFAULT_PROFILE_NAME;
    }

}

module.exports = Download;
