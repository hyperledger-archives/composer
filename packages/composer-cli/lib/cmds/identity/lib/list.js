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

        let participants = new Map();

        const spinner = ora('List all identities in the business network ');
        spinner.start();

        businessNetworkConnection = cmdUtil.createBusinessNetworkConnection();
        return businessNetworkConnection.connect(cardName)
        .then((result) => {
            businessNetworkDefinition = result;
            return businessNetworkConnection.getAllParticipantRegistries();
        })
        .then((participantRegistries) => {
            return Promise.all(participantRegistries.map((registry) => {
                return registry.getAll();
            }));
        })
        .then((participantArrays) => {
            return Promise.all(
            participantArrays.reduce(
                (accumulator, currentValue) => accumulator.concat(currentValue),
                []
            ));
        })
        .then((allParticipants) => {
            return Promise.all(allParticipants.map((registryParticipant) => {
                return participants.set(registryParticipant.getFullyQualifiedIdentifier(), registryParticipant);
            }));
        })
        .then(() => {
            return businessNetworkConnection.getIdentityRegistry();
        })
        .then((identityRegistry) => {
            return identityRegistry.getAll();
        })
        .then((identities) => {
            spinner.succeed();
            const serializer = businessNetworkDefinition.getSerializer();
            const json = identities.map((identity) => {
                let jsonIdentity = serializer.toJSON(identity);
                let fqi = jsonIdentity.participant.replace('resource:', '');

                if (identity.participant.getType() !== 'NetworkAdmin' && jsonIdentity.state !== 'REVOKED') {
                    if (!participants.get(fqi)) {
                        jsonIdentity.state = 'BOUND PARTICIPANT NOT FOUND';
                    }
                }

                return jsonIdentity;
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
