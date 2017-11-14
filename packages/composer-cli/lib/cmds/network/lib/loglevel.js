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

/**
 * <p>
 * Composer "network loglevel" command
 * </p>
 * @private
 */
class LogLevel {

  /**
    * Command process for loglevel command
    * @param {string} argv argument list from composer command
    * @return {Promise} promise when command complete
    */
    static handler(argv) {
        let adminConnection;
        let businessNetworkName;
        let newlevel = argv.newlevel;
        let cardName = argv.card;

        adminConnection = cmdUtil.createAdminConnection();
        return adminConnection.connect(cardName)
        .then(() => {
            if (newlevel) {
                return adminConnection.setLogLevel(newlevel);
            } else {
                return adminConnection.getLogLevel();
            }
        })
        .then((result) => {
            if (newlevel) {
                cmdUtil.log(chalk.blue.bold('The logging level was successfully changed for: ')+businessNetworkName);
            } else {
                cmdUtil.log(chalk.blue.bold('The current logging level is: ')+result);
            }
        });
    }
}

module.exports = LogLevel;
