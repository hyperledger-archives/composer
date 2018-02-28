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
    */
    static async handler(argv) {
        const cardName = argv.card;
        const networkName = argv.networkName;
        const networkVersion = argv.networkVersion;
        const logLevel = argv.loglevel;

        cmdUtil.log(chalk.blue.bold(`Starting business network ${networkName} at version ${networkVersion}`));
        cmdUtil.log('');

        // Build the start options.
        const startOptions = cmdUtil.parseOptions(argv);
        if (logLevel) {
            startOptions.logLevel = logLevel;
        }

        // grab the network admins
        // what we want is an array of the following
        // {userName, certificate, secret, file}
        const networkAdmins = cmdUtil.parseNetworkAdmins(argv);
        startOptions.networkAdmins = networkAdmins;
        cmdUtil.log(chalk.bold.blue('Processing these Network Admins: '));
        networkAdmins.forEach(e => {
            cmdUtil.log(chalk.blue('\tuserName: ') + e.userName);
        });
        cmdUtil.log('');

        const spinner = ora('Starting business network definition. This may take a minute...').start();
        try {
            const adminConnection = cmdUtil.createAdminConnection();
            await adminConnection.connect(cardName);

            const adminCardMap = await adminConnection.start(networkName, networkVersion, startOptions);
            const writeNetworkAdminCardPromises = Array.from(adminCardMap.values()).map(card => {
                // check the networkAdmins for matching name and return the file
                const adminMatch = networkAdmins.find(e => (e.userName === card.getUserName()));
                const fileName = (adminMatch && adminMatch.file) || cmdUtil.getDefaultCardName(card) + '.card';
                return Export.writeCardToFile(fileName, card).then(() => fileName);
            });

            const cardFileNames = await Promise.all(writeNetworkAdminCardPromises);

            spinner.succeed();
            cmdUtil.log(chalk.bold.blue('Successfully created business network card'+(cardFileNames.length>1? 's:':':')));
            cardFileNames.forEach(e => {
                cmdUtil.log(chalk.blue('\tFilename: ') + e);
            });
        } catch (error) {
            spinner.fail();
            throw error;
        }
    }

}

module.exports = Start;
