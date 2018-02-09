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

const chalk = require('chalk');
const cmdUtil = require('../../utils/cmdutils');
const ora = require('ora');
const Export = require('../../card/lib/export');

/**
 * Composer start command
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
        const cardName = argv.card;
        const logLevel = argv.loglevel;
        const networkName = argv.networkName;
        const networkVersion = argv.networkVersion;
        let adminConnection;
        let spinner;
        let networkAdmins;

        // needs promise resolve here in case the archive errors
        return Promise.resolve().then(() => {
            cmdUtil.log(chalk.blue.bold(`Starting business network ${networkName} at version ${networkVersion}`));
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

            return adminConnection.start(networkName, networkVersion, startOptions);
        }).then(adminCardMap => {
            const promises = Array.from(adminCardMap.values()).map(card => {
                // check the networkAdmins for matching name and return the file
                const adminMatch = networkAdmins.find(e => {
                    return (e.userName === card.getUserName());
                });
                const fileName = (adminMatch && adminMatch.file) || cmdUtil.getDefaultCardName(card) + '.card';
                return Export.writeCardToFile(fileName, card).then(() => fileName);
            });

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

}

module.exports = Start;
