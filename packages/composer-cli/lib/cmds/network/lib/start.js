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
const Export = require('../../card/lib/export');

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
    static handler(argv) {

        let businessNetworkDefinition;

        let adminConnection;
        let businessNetworkName;
        let spinner;
        let logLevel = argv.loglevel;
        let cardName = argv.card;

        let networkAdmins;

        // needs promise resolve here in case the archive errors
        return Promise.resolve().then(() => {
            cmdUtil.log(chalk.blue.bold('Starting business network from archive: ')+argv.archiveFile);
            let archiveFileContents = null;
            // Read archive file contents
            archiveFileContents = Start.getArchiveFileContents(argv.archiveFile);
            return BusinessNetworkDefinition.fromArchive(archiveFileContents);
        })
        .then ((result) => {
            businessNetworkDefinition = result;
            businessNetworkName = businessNetworkDefinition.getIdentifier();
            cmdUtil.log(chalk.blue.bold('Business network definition:'));
            cmdUtil.log(chalk.blue('\tIdentifier: ')+businessNetworkName);
            cmdUtil.log(chalk.blue('\tDescription: ')+businessNetworkDefinition.getDescription());
            cmdUtil.log('');
            adminConnection = cmdUtil.createAdminConnection();

            return adminConnection.connect(cardName);
        })
        .then(() => {
            // Build the start options.
            let startOptions = cmdUtil.parseOptions(argv);
            if (logLevel) {
                startOptions.logLevel = logLevel;
            }

            // grab the network admins
            // what we want is an array of the following
            // {userName, certificate, secret, file}
            startOptions.networkAdmins = networkAdmins = cmdUtil.parseNetworkAdmins(argv);
            cmdUtil.log(chalk.bold.blue('Processing these Network Admins: '));
            startOptions.networkAdmins.forEach((e)=>{
                cmdUtil.log(chalk.blue('\tuserName: ')+e.userName);
            });
            cmdUtil.log('');

            spinner = ora('Starting business network definition. This may take a minute...').start();
                // Start the business network.

            return adminConnection.start(businessNetworkDefinition, startOptions);
        }).then((result) => {
            let promises = [];
            for (let card of result.values()){
                // does the card have it's own business network
                // check the networkAdmins for matching name and return the file
                let fileName;
                let adminMatch = networkAdmins.find( (e)=>{
                    return (e.userName === card.getUserName());
                });

                if (adminMatch){
                    fileName = adminMatch.file;
                }

                if (!fileName){
                    let bnn = card.getBusinessNetworkName();
                    if (bnn){
                        fileName = card.getUserName()+'@'+ bnn +'.card';
                    } else {
                        let cpn = card.getConnectionProfile().name;
                        fileName = card.getUserName()+'@'+ cpn +'.card';
                    }
                }

                promises.push( Export.writeCardToFile(fileName,card)
                        .then(()=>{
                            return fileName;
                        }));
            }

            return Promise.all(promises);
        }).then((result)=>{
            spinner.succeed();
            let cards = cmdUtil.arrayify(result);
            cmdUtil.log(chalk.bold.blue('Successfully created business network card'+(cards.length>1? 's:':':')));
            cards.forEach((e)=>{
                cmdUtil.log(chalk.blue('\tFilename: ')+e);
            });

            return result;
        }).catch((error) => {
            if (spinner) {
                spinner.fail();
            }
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
