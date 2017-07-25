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

const cmdUtil = require('../../utils/cmdutils');

const ora = require('ora');


/**
 * <p>
 * Composer upgrade command
 * </p>
 * @private
 */
class Upgrade {

   /**
    * Command process for upgrade command
    * @param {string} argv argument list from composer command
    * @return {Promise} promise when command complete
    */
    static handler(argv) {

        let adminConnection;
        let spinner;

        return (() => {
            spinner = ora('Upgrading runtime for business network ' + argv.businessNetworkName + '. This may take a minute...').start();
            adminConnection = cmdUtil.createAdminConnection();
            return adminConnection.connect(argv.connectionProfileName, argv.upgradeId, argv.upgradeSecret, null);
        })()
        .then((result) => {
            return adminConnection.upgrade(argv.businessNetworkName);
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
}

module.exports = Upgrade;
