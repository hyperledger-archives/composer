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

const LOG = Logger.getLog('Factory');

/**
 * Use the Factory to create instances of Resource: transactions, participants and assets.
 *
 * Do not attempt to create an instance of this class.<br>
 * You must use the {@link runtime-api#getFactory getFactory}
 * method instead.
 *
 * @class Factory
 * @summary A factory creates new instances of assets, participants, transactions,
 * and relationships.
 * @memberof module:composer-runtime
 * @public
 */
class Factory {

    /**
     * Constructor.
     * @param {Factory} factory The factory to use.
     * @private
     */
    constructor(factory) {
        const method = 'constructor';
        LOG.entry(method, factory);

        /**
         * Create a new resource (an instance of an asset, participant, or transaction). The
         * properties of the new instance should be set as standard JavaScript
         * object properties. The new instance can then be stored in a registry
         * using the appropriate registry APIs, for example {@link AssetRegistry}.
         * @example
         * // Get the factory.
         * var factory = getFactory();
         * // Create a new vehicle.
         * var vehicle = factory.newResource('org.example', 'Vehicle', 'VEHICLE_1');
         * // Set the properties of the new vehicle.
         * vehicle.colour = 'BLUE';
         * vehicle.manufacturer = 'Toyota';
         * @public
         * @method module:composer-runtime.Factory#newResource
         * @param {string} ns The namespace of the resource to create.
         * @param {string} type The type of the resource to create.
         * @param {string} id The identifier of the new resource.
         * @return {Resource} The new instance of the resource.
         * @throws {Error} If the specified type (specified by the namespace and
         * type) is not defined in the current version of the business network.
         */
        this.newResource = function newResource(ns, type, id) {
            return factory.newResource(ns, type, id);
        };

        /**
         * Create a new relationship with a given namespace, type, and identifier.
         * A relationship is a typed pointer to an instance. For example, a new
         * relationship with namespace 'org.example', type 'Vehicle' and identifier
         * 'VEHICLE_1' creates` a pointer that points at an existing instance of
         * org.example.Vehicle with the identifier 'VEHICLE_1'.
         * @example
         * // The existing driver of the vehicle.
         * var driver;
         * // Get the factory.
         * var factory = getFactory();
         * // Create a new relationship to the vehicle.
         * var vehicle = factory.newRelationship('org.example', 'Vehicle', 'VEHICLE_1');
         * // Set the relationship as the value of the vehicle property of the driver.
         * driver.vehicle = vehicle;
         * @public
         * @method module:composer-runtime.Factory#newRelationship
         * @param {string} ns The namespace of the resource referenced by the relationship.
         * @param {string} type The type of the resource referenced by the relationship.
         * @param {string} id The identifier of the resource referenced by the relationship.
         * @return {Relationship} The new instance of the relationship.
         * @throws {Error} If the specified type (specified by the namespace and
         * type) is not defined in the current version of the business network.
         */
        this.newRelationship = function newRelationship(ns, type, id) {
            return factory.newRelationship(ns, type, id);
        };

        /**
         * Create a new concept with a given namespace, type, and identifier.
         * A concept is an advanced data structure
         * @example
         * // The existing driver of the vehicle.
         * var person;
         * // Get the factory.
         * var factory = getFactory();
         * // Create a new relationship to the vehicle.
         * var record = factory.newConcept('org.example', 'Record');
         * // Add the record to the persons array of records.
         * person.records.push(record);
         * @public
         * @method module:composer-runtime.Factory#newConcept
         * @param {string} ns The namespace of the concept.
         * @param {string} type The type of the concept.
         * @return {Concept} The new instance of the concept.
         * @throws {Error} If the specified type (specified by the namespace and
         * type) is not defined in the current version of the business network.
         */
        this.newConcept = function newConcept(ns, type) {
            return factory.newConcept(ns, type);
        };

        /**
         * Create a new type with a given namespace and type
         * @public
         * @method module:composer-runtime.Factory#newEvent
         * @param {string} ns The namespace of the event.
         * @param {string} type The type of the event.
         * @return {Resource} The new instance of the event.
         * @throws {Error} If the specified type (specified by the namespace and
         * type) is not defined in the current version of the business network.
         */
        this.newEvent = function newEvent(ns, type) {
            return factory.newEvent(ns, type);
        };

        Object.freeze(this);
        LOG.exit(method);
    }

}

module.exports = Factory;
