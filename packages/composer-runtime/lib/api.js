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

const AssetRegistry = require('./api/assetregistry');
const Factory = require('./api/factory');
const Logger = require('composer-common').Logger;
const ParticipantRegistry = require('./api/participantregistry');
const Query = require('./api/query');
const Registry = require('./registry');
const Serializer = require('./api/serializer');

const LOG = Logger.getLog('Api');

/**
 * A class that contains the root of the transaction processor API. Methods in this
 * class are made available as global functions which can be called by transaction
 * processor functions. The transaction processor API should expose no internal
 * properties or internal methods which could be accessed or misused.
 *
 * @class
 * @memberof module:composer-runtime
 */
class Api {

    /**
     * The runtime API method names.
     * @private
     * @returns {String[]} The runtime API method names.
     */
    static getMethodNames() {
        return [
            'getFactory',
            'getSerializer',
            'getAssetRegistry',
            'getParticipantRegistry',
            'getCurrentParticipant',
            'getCurrentIdentity',
            'post',
            'emit',
            'buildQuery',
            'query',
            'getNativeAPI'
        ];
    }

    /**
     * Constructor.
     * @param {Context} context The transaction context.
     * @private
     */
    constructor(context) {
        const method = 'constructor';
        LOG.entry(method, context);

        // Get all the things from the context.
        const factory = context.getFactory();
        const serializer = context.getSerializer();
        const participant = context.getParticipant();
        const identity = context.getIdentity();
        const registryManager = context.getRegistryManager();
        const httpService = context.getHTTPService();
        const eventService = context.getEventService();
        const dataService = context.getDataService();
        const accessController = context.getAccessController();

        /**
         * Get the factory. The factory can be used to create new instances of
         * assets, participants, and transactions for storing in registries. The
         * factory can also be used for creating relationships to assets, particpants,
         * and transactions.
         * @see {@link module:composer-runtime.Factory}
         * @example
         * // Get the factory.
         * var factory = getFactory();
         * @method module:composer-runtime#getFactory
         * @public
         * @return {module:composer-runtime.Factory} The factory.
         */
        this.getFactory = function getFactory() {
            const method = 'getFactory';
            LOG.entry(method);
            let result = new Factory(factory);
            LOG.exit(method, result);
            return result;
        };

        /**
         * Get the serializer. The serializer can be used to create new instances of
         * assets, participants, and transactions from a JavaScript object, or to create
         * a JavaScript object suitable for long-lived persistence.
         * @example
         * // Get the serializer.
         * var ser = getSerializer();
         * @method module:composer-runtime#getSerializer
         * @public
         * @return {module:composer-common.Serializer} The serializer.
         */
        this.getSerializer = function getSerializer() {
            const method = 'getSerializer';
            LOG.entry(method);
            let result = new Serializer(serializer);
            LOG.exit(method, result);
            return result;
        };

        /**
         * Get an existing asset registry using the unique identifier of the asset
         * registry. An asset registry can be used to retrieve, update, or delete
         * existing assets, or create new assets.
         * @example
         * // Get the vehicle asset registry.
         * return getAssetRegistry('org.example.Vehicle')
         *   .then(function (vehicleAssetRegistry) {
         *     // Call methods on the vehicle asset registry.
         *   })
         *   .catch(function (error) {
         *     // Add optional error handling here.
         *   });
         * @method module:composer-runtime#getAssetRegistry
         * @public
         * @param {string} id The ID of the asset registry.
         * @return {Promise} A promise. The promise is resolved with an {@link
         * module:composer-runtime.AssetRegistry AssetRegistry} instance
         * representing the asset registry if it exists. If the asset registry
         * does not exist, or the current user does not have access to the asset
         * registry, then the promise will be rejected with an error that describes
         * the problem.
         */
        this.getAssetRegistry = function getAssetRegistry(id) {
            const method = 'getAssetRegistry';
            LOG.entry(method, id);
            return registryManager.get('Asset', id)
                .then((registry) => {
                    let result = new AssetRegistry(registry);
                    LOG.exit(method, result);
                    return result;
                });
        };

        /**
         * Get an existing participant registry using the unique identifier of the participant
         * registry. An participant registry can be used to retrieve, update, or delete
         * existing participants, or create new participants.
         * @example
         * // Get the driver participant registry.
         * return getParticipantRegistry('org.example.Driver')
         *   .then(function (driverParticipantRegistry) {
         *     // Call methods on the driver participant registry.
         *   })
         *   .catch(function (error) {
         *     // Add optional error handling here.
         *   });
         * @method module:composer-runtime#getParticipantRegistry
         * @public
         * @param {string} id The ID of the participant registry.
         * @return {Promise} A promise. The promise is resolved with an {@link
         * module:composer-runtime.ParticipantRegistry ParticipantRegistry} instance
         * representing the participant registry if it exists. If the participant registry
         * does not exist, or the current user does not have access to the participant
         * registry, then the promise will be rejected with an error that describes
         * the problem.
         */
        this.getParticipantRegistry = function getParticipantRegistry(id) {
            const method = 'getParticipantRegistry';
            LOG.entry(method, id);
            return registryManager.get('Participant', id)
                .then((registry) => {
                    let result = new ParticipantRegistry(registry);
                    LOG.exit(method, result);
                    return result;
                });
        };

        /**
         * Get the current participant. The current participant is determined by
         * the identity that was used to submit the current transaction.
         * @example
         * // Get the current participant.
         * var currentParticipant = getCurrentParticipant();
         * // Check to see if the current participant is a driver.
         * if (currentParticipant.getFullyQualifiedType() !== 'org.example.Driver') {
         *   // Throw an error as the current participant is not a driver.
         *   throw new Error('Current participant is not a driver');
         * }
         * // Check to see if the current participant is the first driver.
         * if (currentParticipant.getFullyQualifiedIdentifier() !== 'org.example.Driver#DRIVER_1') {
         *   // Throw an error as the current participant is not a driver.
         *   throw new Error('Current participant is not the first driver');
         * }
         * @method module:composer-runtime#getCurrentParticipant
         * @public
         * @return {module:composer-common.Resource} The current participant,
         * or null if the transaction was submitted using an identity that does
         * not map to a participant.
         */
        this.getCurrentParticipant = function getCurrentParticipant() {
            const method = 'getCurrentParticipant';
            LOG.entry(method);
            let result = participant;
            LOG.exit(method, result);
            return result;
        };

        /**
         * Get the current identity. The current identity is the identity
         * that was used to submit the current transaction.
         * @example
         * // Get the current identity.
         * var currentIdentity = getCurrentIdentity();
         * // Get the certificate from the current identity.
         * var certificate = currentIdentity.certificate;
         * @method module:composer-runtime#getCurrentIdentity
         * @public
         * @return {module:composer-common.Resource} The current identity,
         * or null if the transaction was submitted using an identity that does
         * not map to a participant.
         */
        this.getCurrentIdentity = function getCurrentIdentity() {
            const method = 'getCurrentIdentity';
            LOG.entry(method);
            let result = identity;
            LOG.exit(method, result);
            return result;
        };

        /**
         * Post a typed instance to a HTTP URL
         * @method module:composer-runtime#post
         * @param {string} url The URL to post the data to
         * @param {Typed} typed The typed instance to be posted. The instance will be serialized to JSON.
         * @param {object} options The options that are passed to Serializer.toJSON
         * @deprecated since v0.18.1, use the built-in request module instead
         * @return {Promise} A promise. The promise is resolved with a HttpResponse
         * that represents the result of the HTTP POST.
         * @public
         */
        this.post = function post(url, typed, options) {
            const method = 'post';
            LOG.entry(method, url, typed);
            const data = serializer.toJSON(typed, options);
            LOG.debug(method, typed.getFullyQualifiedType(), data);

            return httpService.post(url, data)
                .then((response) => {
                    LOG.exit(method);
                    return Promise.resolve(response);
                });
        };

        /**
         * Emit an event defined in the transaction
         * @method module:composer-runtime#emit
         * @param {Resource} event The event to be emitted
         * @public
         */
        this.emit = function emit(event) {
            const method = 'emit';
            LOG.entry(method, event);
            event.setIdentifier(context.getTransaction().getIdentifier() + '#' + context.getEventNumber());
            event.timestamp = context.getTransaction().timestamp;
            let serializedEvent = serializer.toJSON(event, {
                convertResourcesToRelationships: true,
                permitResourcesForRelationships: false
            });
            context.incrementEventNumber();
            LOG.debug(method, event.getFullyQualifiedIdentifier(), serializedEvent);
            eventService.emit(serializedEvent);
            LOG.exit(method);
        };

        /**
         * Build a query ready for later execution. The specified query string must be written
         * in the Composer query language.
         *
         * This functionality is Blockchain platform dependent. For example, when a Composer
         * business network is deployed to Hyperledger Fabric v1.0, Hyperledger Fabric must be
         * configured with the CouchDB database for the world state.
         * @example
         * // Build a query.
         * var q = buildQuery('SELECT org.example.sample.SampleAsset WHERE (value == _$inputValue)');
         * // Execute the query.
         * return query(q, { inputValue: 'blue' })
         *   .then(function (assets) {
         *     assets.forEach(function (asset) {
         *       // Process each asset.
         *     });
         *   })
         *   .catch(function (error) {
         *     // Add optional error handling here.
         *   });
         * @method module:composer-runtime#buildQuery
         * @param {string} query The query string, written using the Composer query language.
         * @return {Query} The built query, which can be passed in a call to query.
         * @public
         */
        this.buildQuery = function buildQuery(query) {
            const method = 'buildQuery';
            LOG.entry(method, query);
            const identifier = context.getCompiledQueryBundle().buildQuery(query);
            const result = new Query(identifier);
            LOG.exit(method, result);
            return result;
        };

        /**
         * Execute a query defined in a Composer query file, or execute a query built with buildQuery.
         *
         * This functionality is Blockchain platform dependent. For example, when a Composer
         * business network is deployed to Hyperledger Fabric v1.0, Hyperledger Fabric must be
         * configured with the CouchDB database for the world state.
         * @example
         * // Execute the query.
         * return query('Q1', { inputValue: 'blue' })
         *   .then(function (assets) {
         *     assets.forEach(function (asset) {
         *       // Process each asset.
         *     });
         *   })
         *   .catch(function (error) {
         *     // Add optional error handling here.
         *   });
         * @method module:composer-runtime#query
         * @param {string|Query} query The name of the query, or a built query.
         * @param {Object} [parameters] The parameters for the query.
         * @return {Promise} A promise that will be resolved with an array of
         * {@link module:composer-common.Resource Resource} representing the
         * resources returned by the query.
         * @public
         */
        this.query = function query(query, parameters) {
            const method = 'query';
            LOG.entry(method, query);
            let identifier;
            if (query instanceof Query) {
                identifier = query.getIdentifier();
            } else if (typeof query === 'string') {
                identifier = query;
            } else {
                throw new Error('Invalid query; expecting a built query or the name of a query');
            }
            return context.getCompiledQueryBundle().execute(dataService, identifier, parameters)
                .then((objects) => {
                    return objects.map((object) => {
                        object = Registry.removeInternalProperties(object);
                        return serializer.fromJSON(object);
                    }).reduce((resources, resource) => {
                        return resources.then((resources) => {
                            return accessController.check(resource, 'READ')
                                .then(() => {
                                    resources.push(resource);
                                    return resources;
                                })
                                .catch((error) => {
                                    return resources;
                                });
                        });
                    }, Promise.resolve([]));
                })
                .then((resources) => {
                    LOG.exit(method, resources);
                    return resources;
                });
        };

        /**
         * Get the native api for a runtime
         *
         * This functionality is blockchain specific
         * and will throw an error if used with a runtime that doesn't support it
         *
         * @example
         * // Get the native api
         * getNativeAPI().getChannelID();
         *
         * @method module:composer-runtime#getNativeAPI
         * @public
         * @returns {NativeAPI} the native api for a runtime
         */
        this.getNativeAPI = function () {
            const method = 'getNativeAPI';
            LOG.entry(method);
            const nativeAPI = context.getNativeAPI();
            LOG.exit(method, nativeAPI);
            return nativeAPI;
        };

        Object.freeze(this);
        LOG.exit(method);
    }
}

module.exports = Api;
