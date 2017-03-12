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

const Logger = require('composer-common').Logger;
const Resource = require('composer-common').Resource;

const LOG = Logger.getLog('IdentityManager');

/**
 * A class for managing and persisting identities.
 * @protected
 */
class IdentityManager {

    /**
     * Constructor.
     * @param {DataService} dataService The data service to use.
     * @param {RegistryManager} registryManager The registry manager to use.
     * @param {DataCollection} sysidentities The system identities collection.
     */
    constructor(dataService, registryManager, sysidentities) {
        this.dataService = dataService;
        this.registryManager = registryManager;
        this.sysidentities = sysidentities;
    }

    /**
     * Add a new mapping for the specified identity (user ID) to the specified
     * participant.
     * @param {(Resource|string)} participant The participant, or the unique
     * identifier of the participant.
     * @param {string} userID The identity (user ID) to map to the participant.
     * @return {Promise} A promise that is resolved when a new mapping for the
     * specified identity has been created.
     */
    addIdentityMapping(participant, userID) {
        const method = 'addIdentityMapping';
        LOG.entry(method, participant, userID);
        let participantFQI, participantFQT, participantID;
        if (participant instanceof Resource) {
            participantFQI = participant.getFullyQualifiedIdentifier();
            participantFQT = participant.getFullyQualifiedType();
            participantID = participant.getIdentifier();
        } else {
            participantFQI = participant;
            let hashIndex = participantFQI.indexOf('#');
            if (hashIndex === -1) {
                throw new Error('Invalid fully qualified participant identifier');
            }
            participantFQT = participantFQI.substring(0, hashIndex);
            participantID = participantFQI.substring(hashIndex + 1);
        }
        LOG.debug(method, 'Looking for participant registry', participantFQT);
        return this.registryManager.get('Participant', participantFQT)
            .then((participantRegistry) => {
                LOG.debug(method, 'Found participant registry, looking for participant', participantID);
                return participantRegistry.get(participantID);
            })
            .then((participant) => {
                LOG.debug(method, 'Got $sysidentities collection, checking for existing mapping');
                return this.sysidentities.exists(userID);
            })
            .then((exists) => {
                if (exists) {
                    LOG.error(method, 'Found an existing mapping for user ID', userID);
                    throw new Error(`Found an existing mapping for user ID '${userID}'`);
                }
                LOG.debug(method, 'No existing mapping exists for user ID, adding');
                return this.sysidentities.add(userID, {
                    participant: participantFQI
                });
            })
            .then(() => {
                LOG.exit(method);
            });
    }

    /**
     * Remove an existing mapping for the specified identity (user ID) to a
     * participant.
     * @param {string} userID The identity (user ID).
     * @return {Promise} A promise that is resolved when a new mapping for the
     * specified identity has been created.
     */
    removeIdentityMapping(userID) {
        const method = 'removeIdentityMapping';
        LOG.entry(method, userID);
        LOG.debug(method, 'Got $sysidentities collection, checking for existing mapping');
        return this.sysidentities.exists(userID)
            .then((exists) => {
                if (!exists) {
                    LOG.debug('No existing mapping exists for user ID, ignoring');
                    return;
                }
                return this.sysidentities.remove(userID);
            })
            .then(() => {
                LOG.exit(method);
            });
    }

    /**
     * Retrieve the participant for the specified identity (user ID).
     * @param {string} userID The identity (user ID).
     * @return {Promise} A promise that is resolved with a {@link Resource}
     * representing the participant, or rejected with an error.
     */
    getParticipant(userID) {
        const method = 'getParticipant';
        LOG.entry(method, userID);
        LOG.debug(method, 'Getting $sysidentities collection');
        let participantFQI, participantFQT, participantID;
        LOG.debug(method, 'Got $sysidentities collection, checking for existing mapping');
        return this.sysidentities.get(userID)
            .then((mapping) => {
                participantFQI = mapping.participant;
                LOG.debug(method, 'Found mapping, participant is', participantFQI);
                let hashIndex = participantFQI.indexOf('#');
                if (hashIndex === -1) {
                    throw new Error('Invalid fully qualified participant identifier');
                }
                participantFQT = participantFQI.substring(0, hashIndex);
                participantID = participantFQI.substring(hashIndex + 1);
                LOG.debug(method, 'Looking for participant registry', participantFQT);
                return this.registryManager.get('Participant', participantFQT);
            })
            .then((participantRegistry) => {
                LOG.debug(method, 'Found participant registry, looking for participant', participantID);
                return participantRegistry.get(participantID);
            })
            .then((participant) => {
                LOG.exit(method, participant);
                return participant;
            });
    }

}

module.exports = IdentityManager;
