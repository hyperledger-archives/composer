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

const Admin = require('composer-admin');
const BusinessNetworkDefinition = Admin.BusinessNetworkDefinition;
const chalk = require('chalk');
const cmdUtil = require('../../utils/cmdutils');
const fs = require('fs');
const LogLevel = require('./loglevel');
const ora = require('ora');

/**
 * <p>
 * Composer deploy command
 * </p>
 * <p><a href="diagrams/Deploy.svg"><img src="diagrams/deploy.svg" style="width:100%;"/></a></p>
 * @private
 */
class Deploy {

   /**
    * Command process for deploy command
    * @param {string} argv argument list from composer command
    * @param {boolean} updateOption true if the network is to be updated
    * @return {Promise} promise when command complete
    */
    static handler(argv, updateOption) {

        let updateBusinessNetwork = (updateOption === true)
                                  ? true
                                  : false;
        let businessNetworkDefinition;

        let adminConnection;
        let enrollId;
        let enrollSecret;
        let connectionProfileName = argv.connectionProfileName;
        let businessNetworkName;
        let spinner;
        let loglevel;

        if (argv.loglevel) {
            // validate log level as yargs cannot at this time
            // https://github.com/yargs/yargs/issues/849
            loglevel = argv.loglevel.toUpperCase();
            if (!LogLevel.validLogLevel(loglevel)) {
                return Promise.reject(new Error('loglevel unspecified or not one of (INFO|WARNING|ERROR|DEBUG)'));
            }
        }

        return (() => {
            console.log(chalk.blue.bold('Deploying business network from archive: ')+argv.archiveFile);

            if (!argv.enrollSecret) {
                return cmdUtil.prompt({
                    name: 'enrollmentSecret',
                    description: 'What is the enrollment secret of the user?',
                    required: true,
                    hidden: true,
                    replace: '*'
                })
                .then((result) => {
                    argv.enrollSecret = result.enrollmentSecret;
                });
            } else {
                return Promise.resolve();
            }
        })()
        .then (() => {
            enrollId = argv.enrollId;
            enrollSecret = argv.enrollSecret;
            let archiveFileContents = null;
            // Read archive file contents
            archiveFileContents = Deploy.getArchiveFileContents(argv.archiveFile);
            return BusinessNetworkDefinition.fromArchive(archiveFileContents);
        })
        .then ((result) => {
            businessNetworkDefinition = result;
            businessNetworkName = businessNetworkDefinition.getIdentifier();
            console.log(chalk.blue.bold('Business network definition:'));
            console.log(chalk.blue('\tIdentifier: ')+businessNetworkName);
            console.log(chalk.blue('\tDescription: ')+businessNetworkDefinition.getDescription());
            console.log();
            adminConnection = cmdUtil.createAdminConnection();
            // if we are performing an update we have to actually connect to the network
            // we want to update!
            return adminConnection.connect(connectionProfileName, enrollId, enrollSecret, updateBusinessNetwork ? businessNetworkDefinition.getName() : null);
        })
        .then((result) => {
            if (updateBusinessNetwork === false) {
                spinner = ora('Deploying business network definition. This may take a minute...').start();

                // Build the deploy options.
                let deployOptions = cmdUtil.parseOptions(argv);
                if (loglevel) {
                    deployOptions.logLevel = loglevel;
                }

                // Build the bootstrap tranactions.
                let bootstrapTransactions = cmdUtil.buildBootstrapTransactions(businessNetworkDefinition, argv);

                // Merge the deploy options and bootstrap transactions.
                if (deployOptions.bootstrapTransactions) {
                    deployOptions.bootstrapTransactions = bootstrapTransactions.concat(deployOptions.bootstrapTransactions);
                } else {
                    deployOptions.bootstrapTransactions = bootstrapTransactions;
                }

                // Deploy the business network.
                return adminConnection.deploy(businessNetworkDefinition, deployOptions);

            } else {
                spinner = ora('Updating business network definition. This may take a few seconds...').start();
                return adminConnection.update(businessNetworkDefinition);
            }
        }).then((result) => {
            spinner.succeed();
            console.log();

            return result;
        }).catch((error) => {

            if (spinner) {
                spinner.fail();
            }

            console.log();

            throw error;
        });
    }

    /**
      * Get contents from archive file
      * @param {string} archiveFile connection profile name
      * @return {String} archiveFileContents archive file contents
      */
    static getArchiveFileContents(archiveFile) {
        let archiveFileContents;
        if (fs.existsSync(archiveFile)) {
            archiveFileContents = fs.readFileSync(archiveFile);
        } else {
            throw new Error('Archive file '+archiveFile+' does not exist.');
        }
        return archiveFileContents;
    }

}

module.exports = Deploy;
