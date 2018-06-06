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

/**
 * Composer upgrade command
 * @private
 */
class Upgrade {
   /**
    * Command process for upgrade command
    * @param {string} argv argument list from composer command
    */
    static async handler(argv) {
        const cardName = argv.card;
        const networkName = argv.networkName;
        const networkVersion = argv.networkVersion;

        cmdUtil.log(chalk.blue.bold(`Upgrading business network ${networkName} to version ${networkVersion}`));
        cmdUtil.log('');

        // Build the upgrade options.
        const upgradeOptions = cmdUtil.parseOptions(argv);

        const spinner = ora('Upgrading business network definition. This may take a minute...').start();
        try {
            const adminConnection = cmdUtil.createAdminConnection();
            await adminConnection.connect(cardName);
            await adminConnection.upgrade(networkName, networkVersion, upgradeOptions);
            spinner.succeed();
        } catch (error) {
            spinner.fail();
            throw error;
        }
    }

}

module.exports = Upgrade;
