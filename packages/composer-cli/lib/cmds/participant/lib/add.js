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

/**
 * Composer "participant add" command
 * @private
 */
class Add {

  /**
    * Command process for "participant add" command
    * @param {string} argv argument list from composer command
    * @return {Promise} promise when command complete
    */
    static handler(argv) {
        let businessNetworkConnection;
        let cardName = argv.card;

        return Promise.resolve()
        .then(() => {
            businessNetworkConnection = cmdUtil.createBusinessNetworkConnection();
            return businessNetworkConnection.connect(cardName);
        })
        .then(() => {
            let data = argv.data;
            data = JSON.parse(data);

            let businessNetwork = businessNetworkConnection.getBusinessNetwork();
            let serializer = businessNetwork.getSerializer();
            let resource = serializer.fromJSON(data);

            return businessNetworkConnection.getParticipantRegistry(resource.getFullyQualifiedType())
                .then((participantRegistry) => {
                    return participantRegistry.add(resource);
                });
        })
        .then((submitted) => {
            cmdUtil.log('Participant was added to participant registry.');
        });
    }

}

module.exports = Add;
