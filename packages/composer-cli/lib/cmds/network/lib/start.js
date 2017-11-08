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
const ora = require('ora');
const Create = require('../../card/lib/create');
/**
 * <p>
 * Composer start command
 * </p>
 * @private
 */
class Start {

   /**
    * Command process for start command
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
        let businessNetworkName;
        let spinner;
        let logLevel = argv.loglevel;
        let cardName = argv.card;
        let card;
        let filename;

        // needs promise resolve here in case the archive errors
        return Promise.resolve().then(() => {
            console.log(chalk.blue.bold('Starting business network from archive: ')+argv.archiveFile);
            let archiveFileContents = null;
            // Read archive file contents
            archiveFileContents = Start.getArchiveFileContents(argv.archiveFile);
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

            return adminConnection.connect(cardName);
        })
        .then(() => {
            // need to get the card now for later use
            return adminConnection.getCard(cardName);
        })
        .then((_card) => {
            card = _card;
            if (updateBusinessNetwork === false) {
                spinner = ora('Starting business network definition. This may take a minute...').start();

                // Build the start options.
                let startOptions = cmdUtil.parseOptions(argv);
                if (logLevel) {
                    startOptions.logLevel = logLevel;
                }
                startOptions.card = card;
                // Build the bootstrap tranactions.
                let bootstrapTransactions = cmdUtil.buildBootstrapTransactions(businessNetworkDefinition, argv);

                // Merge the start options and bootstrap transactions.
                if (startOptions.bootstrapTransactions) {
                    startOptions.bootstrapTransactions = bootstrapTransactions.concat(startOptions.bootstrapTransactions);
                } else {
                    startOptions.bootstrapTransactions = bootstrapTransactions;
                }

                // Start the business network.
                return adminConnection.start(businessNetworkDefinition, startOptions);

            } else {
                spinner = ora('Updating business network definition. This may take a few seconds...').start();
                return adminConnection.update(businessNetworkDefinition);
            }
        }).then((result) => {

            if (!updateBusinessNetwork){
                // need to create a card for the admin and then write it to disk for the user
                // to import
                // set if the options have been given into the metadata
                let metadata= {
                    version : 1,
                    userName : argv.networkAdmin,
                    businessNetwork : businessNetworkDefinition.getName()
                };
                // copy across any other parameters that might be used
                let createArgs = {};
                if (argv.file){
                    createArgs.file = argv.file;
                }

                if (argv.networkAdminEnrollSecret){
                    metadata.enrollmentSecret = argv.networkAdminEnrollSecret;
                } else {
                    // the networkAdminCertificateFile will be set unless yargs has got it's job wrong!
                    createArgs.certificate = argv.networkAdminCertificateFile;
                }

                return Create.createCard(metadata,card.getConnectionProfile(),createArgs).then((_filename)=>{
                    filename = _filename;
                    return;
                });
            }
            return result;
        }).then((result)=>{
            spinner.succeed();
            console.log('Successfully created business network card to '+filename);

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
module.exports = Start;
