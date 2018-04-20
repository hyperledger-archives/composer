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

const LOG = Logger.getLog('ParticipantRegistry');

/**
 * The ParticipantRegistry is used to manage a set of participants stored on the blockchain.
 *
 * Do not attempt to create an instance of this class. You must use the {@link runtime-api#getParticipantRegistry getParticipantRegistry}
 * method instead.
 *
 * @class ParticipantRegistry
 * @summary An participant registry manages a set of participants.
 * @memberof module:composer-runtime
 * @public
 */
class ParticipantRegistry {

    /**
     * Constructor.
     * @param {Registry} registry The registry to use.
     * @private
     */
    constructor(registry) {
        const method = 'constructor';
        LOG.entry(method, registry);

        /**
         * Get a list of all of the existing participants in this participant registry.
         * @example
         * // Get the driver participant registry.
         * return getParticipantRegistry('org.example.Driver')
         *   .then(function (participantRegistry) {
         *     // Get all of the drivers in the driver participant registry.
         *     return participantRegistry.getAll();
         *   })
         *   .then(function (drivers) {
         *     // Process the array of driver objects.
         *     drivers.forEach(function (driver) {
         *       console.log(driver.driverId);
         *     });
         *   })
         *   .catch(function (error) {
         *     // Add optional error handling here.
         *   });
         * @public
         * @method module:composer-runtime.ParticipantRegistry#getAll
         * @return {Promise} A promise. The promise is resolved with an array of
         * {@link common-Resource} instances representing all of the participants stored in this
         * participant registry. If the participant registry does not exist, or the current
         * user does not have access to the participant registry, then the promise will
         * be rejected with an error that describes the problem.
         */
        this.getAll = function getAll() {
            return registry.getAll();
        };

        /**
         * Get the specified participant in this participant registry using the unique identifier
         * of the participant.
         * @example
         * // Get the driver participant registry.
         * return getParticipantRegistry('org.example.Driver')
         *   .then(function (participantRegistry) {
         *     // Get the specific driver from the driver participant registry.
         *     return participantRegistry.get('VEHICLE_1');
         *   })
         *   .then(function (driver) {
         *     // Process the the driver object.
         *     console.log(driver.driverId);
         *   })
         *   .catch(function (error) {
         *     // Add optional error handling here.
         *   });
         * @public
         * @method module:composer-runtime.ParticipantRegistry#get
         * @param {string} id The ID of the participant.
         * @return {Promise} A promise. The promise is resolved with a {@link common-Resource}
         * instance representing the specified participant in this participant registry. If the
         * specified participant does not exist, or the current user does not have access
         * to the specified participant, then the promise will be rejected with an error
         * that describes the problem.
         */
        this.get = function get(id) {
            return registry.get(id);
        };

        /**
         * Determines whether a specific participant exists in this participant registry.
         * @example
         * // Get the driver participant registry.
         * return getParticipantRegistry('org.example.Driver')
         *   .then(function (participantRegistry) {
         *     // Determine if the specific driver exists in the driver participant registry.
         *     return participantRegistry.exists('VEHICLE_1');
         *   })
         *   .then(function (exists) {
         *     // Process the the boolean result.
         *     console.log('Driver exists', exists);
         *   })
         *   .catch(function (error) {
         *     // Add optional error handling here.
         *   });
         * @public
         * @method module:composer-runtime.ParticipantRegistry#exists
         * @param {string} id The ID of the participant.
         * @return {Promise} A promise. The promise is resolved with a boolean which
         * is true if the specified participant exists in this participant registry,
         * and false if the specified participant does not exist.
         */
        this.exists = function exists(id) {
            return registry.exists(id);
        };

        /**
         * Add all of the specified participants to this participant registry.
         * @example
         * // Get the driver participant registry.
         * return getParticipantRegistry('org.example.Driver')
         *   .then(function (participantRegistry) {
         *     // Get the factory for creating new participant instances.
         *     var factory = getFactory();
         *     // Create the first driver.
         *     var driver1 = factory.newResource('org.example', 'Driver', 'VEHICLE_1');
         *     driver1.location = 'Southampton';
         *     // Create the second driver.
         *     var driver2 = factory.newResource('org.example', 'Driver', 'VEHICLE_2');
         *     driver2.location = 'GREEN';
         *     // Add the drivers to the driver participant registry.
         *     return participantRegistry.addAll([driver1, driver2]);
         *   })
         *   .catch(function (error) {
         *     // Add optional error handling here.
         *   });
         * @public
         * @method module:composer-runtime.ParticipantRegistry#addAll
         * @param {Resource[]} participants The participants to add to this participant registry.
         * @return {Promise} A promise. The promise is resolved when all of the
         * participants have been added to this participant registry. If the participants cannot be
         * added to this participant registry, or if the participants already exist in the
         * participant registry, then the promise will be rejected with an error
         * that describes the problem.
         */
        this.addAll = function addAll(participants) {
            return registry.addAll(participants, { convertResourcesToRelationships: true });
        };

        /**
         * Add the specified participant to this participant registry.
         * @example
         * // Get the driver participant registry.
         * return getParticipantRegistry('org.example.Driver')
         *   .then(function (participantRegistry) {
         *     // Get the factory for creating new participant instances.
         *     var factory = getFactory();
         *     // Create the driver.
         *     var driver = factory.newResource('org.example', 'Driver', 'VEHICLE_1');
         *     driver.location = 'Southampton';
         *     // Add the driver to the driver participant registry.
         *     return participantRegistry.add(driver);
         *   })
         *   .catch(function (error) {
         *     // Add optional error handling here.
         *   });
         * @public
         * @method module:composer-runtime.ParticipantRegistry#add
         * @param {Resource} participant The participants to add to this participant registry.
         * @return {Promise} A promise. The promise is resolved when the participant has
         * been added to this participant registry. If the participant cannot be added to this
         * participant registry, or if the participant already exists in the participant registry,
         * then the promise will be rejected with an error that describes the problem.
         */
        this.add = function add(participant) {
            return registry.add(participant, { convertResourcesToRelationships: true });
        };

        /**
         * Update all of the specified participants in this participant registry.
         * @example
         * // The existing drivers that have come from elsewhere.
         * var driver1;
         * var driver2;
         * // Get the driver participant registry.
         * return getParticipantRegistry('org.example.Driver')
         *   .then(function (participantRegistry) {
         *     // Get the factory for creating new participant instances.
         *     var factory = getFactory();
         *     // Modify the properties of the first driver.
         *     driver1.location = 'Hursley';
         *     // Modify the properties of the second driver.
         *     driver2.location = 'London';
         *     // Update the drivers in the driver participant registry.
         *     return participantRegistry.updateAll([driver1, driver2]);
         *   })
         *   .catch(function (error) {
         *     // Add optional error handling here.
         *   });
         * @public
         * @method module:composer-runtime.ParticipantRegistry#updateAll
         * @param {Resource[]} participants The participants to update in this participant registry.
         * @return {Promise} A promise. The promise is resolved when all of the
         * participants have been updated in this participant registry. If the participants cannot be
         * updated in this participant registry, or if the participants do not exist in the
         * participant registry, then the promise will be rejected with an error that
         * describes the problem.
         */
        this.updateAll = function updateAll(participants) {
            return registry.updateAll(participants, { convertResourcesToRelationships: true });
        };

        /**
         * Update the specified participant in this participant registry.
         * @example
         * // The existing driver that has come from elsewhere.
         * var driver;
         * // Get the driver participant registry.
         * return getParticipantRegistry('org.example.Driver')
         *   .then(function (participantRegistry) {
         *     // Get the factory for creating new participant instances.
         *     var factory = getFactory();
         *     // Modify the properties of the driver.
         *     driver.location = 'Hursley';
         *     // Update the driver in the driver participant registry.
         *     return participantRegistry.update(driver);
         *   })
         *   .catch(function (error) {
         *     // Add optional error handling here.
         *   });
         * @public
         * @method module:composer-runtime.ParticipantRegistry#update
         * @param {Resource} participant The participant to update in this participant registry.
         * @return {Promise} A promise. The promise is resolved when the participant
         * have been updated in this participant registry. If the participant cannot be
         * updated in this participant registry, or if the participant does not exist in the
         * participant registry, then the promise will be rejected with an error that
         * describes the problem.
         */
        this.update = function update(participant) {
            return registry.update(participant, { convertResourcesToRelationships: true });
        };

        /**
         * Remove all of the specified participants from this participant registry.
         * @example
         * // The existing drivers that have come from elsewhere.
         * var driver1;
         * // Get the driver participant registry.
         * return getParticipantRegistry('org.example.Driver')
         *   .then(function (participantRegistry) {
         *     // Get the factory for creating new participant instances.
         *     var factory = getFactory();
         *     // Remove the drivers from the driver participant registry. Note that
         *     // one driver is specified as a driver instance, and the other
         *     // driver is specified by the ID of the driver.
         *     return participantRegistry.removeAll([driver1, 'VEHICLE_2']);
         *   })
         *   .catch(function (error) {
         *     // Add optional error handling here.
         *   });
         * @public
         * @method module:composer-runtime.ParticipantRegistry#removeAll
         * @param {string[]|Resource[]} participants The participants, or the IDs of the participants,
         * to remove from this participant registry.
         * @return {Promise} A promise. The promise is resolved when all of the
         * participants have been removed from this participant registry. If the participants cannot be
         * removed from this participant registry, or if the participants do not exist in the
         * participant registry, then the promise will be rejected with an error that
         * describes the problem.
         */
        this.removeAll = function removeAll(participants) {
            return registry.removeAll(participants);
        };

        /**
         * Remove the specified participant from this participant registry.
         * @example
         * // The existing driver that has come from elsewhere.
         * var driver;
         * // Get the driver participant registry.
         * return getParticipantRegistry('org.example.Driver')
         *   .then(function (participantRegistry) {
         *     // Get the factory for creating new participant instances.
         *     var factory = getFactory();
         *     // Remove the driver from the driver participant registry.
         *     return participantRegistry.remove(driver);
         *   })
         *   .catch(function (error) {
         *     // Add optional error handling here.
         *   });
         * @public
         * @method module:composer-runtime.ParticipantRegistry#remove
         * @param {string|Resource} participant The participant, or ID of the participant, to remove
         * from this participant registry.
         * @return {Promise} A promise. The promise is resolved when the participant
         * has been removed from this participant registry. If the participant cannot be
         * removed from this participant registry, or if the participant does not exist in the
         * participant registry, then the promise will be rejected with an error that
         * describes the problem.
         */
        this.remove = function remove(participant) {
            return registry.remove(participant);
        };

        Object.freeze(this);
        LOG.exit(method);
    }

}

module.exports = ParticipantRegistry;