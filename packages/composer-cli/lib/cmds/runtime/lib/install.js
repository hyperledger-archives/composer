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
 * Composer install command
 * </p>
 * @private
 */
class Install {

   /**
    * Command process for install command
    * @param {string} argv argument list from composer command
    * @return {Promise} promise when command complete
    */
    static handler(argv) {

        let adminConnection;
        let spinner;
        let cardName = argv.card;

        return (() => {
            spinner = ora('Installing runtime for business network ' + argv.businessNetworkName + '. This may take a minute...').start();
            adminConnection = cmdUtil.createAdminConnection();
            return adminConnection.connect(cardName);
        })()
        .then((result) => {
            let installOptions = cmdUtil.parseOptions(argv);
            return adminConnection.install(argv.businessNetworkName, installOptions);
        }).then((result) => {
            spinner.succeed();
            cmdUtil.log();

            return result;
        }).catch((error) => {
            spinner.fail();
            cmdUtil.log();

            throw error;
        });
    }
}

module.exports = Install;
