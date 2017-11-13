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
const Pretty = require('prettyjson');

/**
 * <p>
 * Composer "identity list" command
 * </p>
 * @private
 */
class List {

  /**
    * Command process for deploy command
    * @param {string} argv argument list from composer command
    * @return {Promise} promise when command complete
    */
    static handler(argv) {
        let businessNetworkConnection;
        let businessNetworkDefinition;
        let cardName = argv.card;

        const spinner = ora('List all identities in the business network ');
        spinner.start();

        businessNetworkConnection = cmdUtil.createBusinessNetworkConnection();
        return businessNetworkConnection.connect(cardName)

        .then((result) => {
            businessNetworkDefinition = result;
            return businessNetworkConnection.getIdentityRegistry();
        })
        .then((identityRegistry) => {
            return identityRegistry.getAll();
        })
        .then((identities) => {
            spinner.succeed();
            const serializer = businessNetworkDefinition.getSerializer();
            const json = identities.map((identity) => {
                return serializer.toJSON(identity);
            });
            cmdUtil.log(Pretty.render(json,{
                keysColor: 'blue',
                dashColor: 'blue',
                stringColor: 'white'
            }));
            return businessNetworkConnection.disconnect();
        })
        .catch(error => {
            spinner.fail();
            throw error;
        });
    }

}

module.exports = List;
