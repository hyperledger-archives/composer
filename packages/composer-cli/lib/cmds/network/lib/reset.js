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
 * Composer "network network reset" command
 * </p>
 * @private
 */
class Reset {

  /**
    * Command process for reset command
    * @param {string} argv argument list from composer command
    * @return {Promise} promise when command complete
    */
    static handler(argv) {
        let adminConnection;
        let cardName = argv.card;
        let spinner;


        adminConnection = cmdUtil.createAdminConnection();
        return adminConnection.connect(cardName)
            .then(() => {
                // nothing is returned from connect
                return adminConnection.exportCard(cardName);
            })
            .then((card)=>{
                spinner = ora('Resetting business network definition. This may take some seconds...').start();
                return adminConnection.reset(card.getBusinessNetworkName());
            }).then((result) => {
                spinner.succeed();
                return result;
            }).catch((error) => {
                if (spinner) {
                    spinner.fail();
                }

                throw error;
            });
    }

}

module.exports = Reset;
