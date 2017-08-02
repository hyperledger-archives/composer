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

const AssetRegistry = require('./assetregistry');
const BusinessNetworkDefinition = require('composer-common').BusinessNetworkDefinition;
const ComboConnectionProfileStore = require('composer-common').ComboConnectionProfileStore;
const ConnectionProfileManager = require('composer-common').ConnectionProfileManager;
const EnvConnectionProfileStore = require('composer-common').EnvConnectionProfileStore;
const EventEmitter = require('events');
const fs = require('fs');
const FSConnectionProfileStore = require('composer-common').FSConnectionProfileStore;
const Logger = require('composer-common').Logger;
const ParticipantRegistry = require('./participantregistry');
const Query = require('./query');
const Relationship = require('composer-common').Relationship;
const Resource = require('composer-common').Resource;
const TransactionDeclaration = require('composer-common').TransactionDeclaration;
const TransactionRegistry = require('./transactionregistry');
const Historian = require('./historian');
const IdentityRegistry = require('./identityregistry');
const Util = require('composer-common').Util;
const uuid = require('uuid');

const LOG = Logger.getLog('BusinessNetworkConnection');

/**
 * Use this class to connect to and then interact with a deployed BusinessNetworkDefinition.
 * Use the AdminConnection class in the composer-admin module to deploy BusinessNetworksDefinitions.
 * @extends EventEmitter
 * @see See [EventEmitter]{@link module:composer-client.EventEmitter}
 * @class
 * @memberof module:composer-client
 */
class BusinessNetworkConnection extends EventEmitter {

    /**
     * Create an instance of the BusinessNetworkConnection class.
     * must be called to connect to a deployed BusinessNetworkDefinition.
     * @param {Object} [options] - an optional set of options to configure the instance.
     * @param {Object} [options.fs] - specify an fs implementation to use.
     * @param {boolean} [options.developmentMode] - specify whether or not the instance
     * is in development mode. Use only for testing purposes!
     */
    constructor(options) {
        super();
        options = options || {};
        this.developmentMode = options.developmentMode || false;
        this.connection = null;

        const fsConnectionProfileStore = new FSConnectionProfileStore(options.fs || fs);
        if (process.env.COMPOSER_CONFIG) {
            const envConnectionProfileStore = new EnvConnectionProfileStore();
            this.connectionProfileStore = new ComboConnectionProfileStore(
                fsConnectionProfileStore,
                envConnectionProfileStore
            );
        } else {
            this.connectionProfileStore = fsConnectionProfileStore;
        }
        this.connectionProfileManager = new ConnectionProfileManager(this.connectionProfileStore);

        this.connection = null;
        this.securityContext = null;
        this.businessNetwork = null;
        this.dynamicQueryFile = null;
    }

    /**
     * Returns the currently connected BusinessNetworkDefinition
     * @example
     * // Get the Business Network Definition
     * var businessNetwork = new BusinessNetworkConnection();
     * return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
     * .then(function(businessNetworkDefinition){
     *     return businessNetworkDefinition.getBusinessNetwork();
     * })
     * .then(function(BusinessNetworkDefinition){
     *     // Retrieved Business Network Definition
     * });
     * @returns {BusinessNetworkDefinition} the business network
     */
    getBusinessNetwork() {
        return this.businessNetwork;
    }

    /**
     * Get a list of all existing asset registries.
     * @example
     * // Get all asset registries
     * var businessNetwork = new BusinessNetworkConnection();
     * return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
     * .then(function(businessNetworkDefinition){
     *     return businessNetworkDefinition.getAllAssetRegistries();
     * })
     * .then(function(assetRegistries){
     *     // Retrieved Asset Registries
     * });
     * @param {SecurityContext} securityContext - The user's security context
     * @return {Promise} - A promise that will be resolved with a list of existing
     * asset registries
     */
    getAllAssetRegistries() {
        Util.securityCheck(this.securityContext);
        return AssetRegistry.getAllAssetRegistries(this.securityContext, this.getBusinessNetwork().getModelManager(), this.getBusinessNetwork().getFactory(), this.getBusinessNetwork().getSerializer(),this);
    }

    /**
     * Get an existing asset registry.
     * @example
     * // Get a asset registry
     * var businessNetwork = new BusinessNetworkConnection();
     * return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
     * .then(function(businessNetworkDefinition){
     *     return businessNetworkDefinition.getAssetRegistry('businessNetworkIdentifier.registryId');
     * })
     * .then(function(assetRegistry){
     *     // Retrieved Asset Registry
     * });
     * @param {string} id - The unique identifier of the asset registry
     * @return {Promise} - A promise that will be resolved with the existing asset
     * registry, or rejected if the asset registry does not exist.
     */
    getAssetRegistry(id) {
        Util.securityCheck(this.securityContext);
        return AssetRegistry.getAssetRegistry(this.securityContext, id, this.getBusinessNetwork().getModelManager(), this.getBusinessNetwork().getFactory(), this.getBusinessNetwork().getSerializer(),this);
    }

    /**
     * Determine whether a asset registry exists.
     * @example
     * // Determine whether an asset registry exists
     * var businessNetwork = new BusinessNetworkConnection();
     * return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
     * .then(function(businessNetworkDefinition){
     *     return businessNetworkDefinition.assetRegistryExists('businessNetworkIdentifier.registryId');
     * })
     * .then(function(exists){
     *     // if (exists === true) {
     *     // logic here...
     *     //}
     * });
     * @param {string} id - The unique identifier of the asset registry
     * @return {Promise} - A promise that will be resolved with a boolean indicating whether the asset
     * registry exists.
     */
    assetRegistryExists(id) {
        Util.securityCheck(this.securityContext);
        return AssetRegistry.assetRegistryExists(this.securityContext, id, this.getBusinessNetwork().getModelManager(), this.getBusinessNetwork().getFactory(), this.getBusinessNetwork().getSerializer(),this);
    }

    /**
     * Add a new asset registry.
     * @example
     * // Add a new asset registry
     * var businessNetwork = new BusinessNetworkConnection();
     * return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
     * .then(function(businessNetworkDefinition){
     *     return businessNetworkDefinition.addAssetRegistry('registryId','registryName');
     * });
     * @param {string} id - The unique identifier of the asset registry
     * @param {string} name - The name of the asset registry
     * @return {Promise} - A promise that will be resolved with the new asset
     * registry after it has been added.
     */
    addAssetRegistry(id, name) {
        Util.securityCheck(this.securityContext);
        return AssetRegistry.addAssetRegistry(this.securityContext, id, name, this.getBusinessNetwork().getModelManager(), this.getBusinessNetwork().getFactory(), this.getBusinessNetwork().getSerializer(),this);
    }

    /**
     * Get a list of all existing participant registries.
     * @exampleserializedResources
     * // Get all participant registries
     * var businessNetwork = new BusinessNetworkConnection();
     * return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
     * .then(function(businessNetworkDefinition){
     *     return businessNetworkDefinition.getAllParticipantRegistries();
     * })
     * .then(function(participantRegistries){
     *     // Retrieved Participant Registries
     * });
     * @param {SecurityContext} securityContext - The user's security context
     * @return {Promise} - A promise that will be resolved with a list of existing
     * participant registries
     */
    getAllParticipantRegistries() {
        Util.securityCheck(this.securityContext);
        return ParticipantRegistry.getAllParticipantRegistries(this.securityContext, this.getBusinessNetwork().getModelManager(), this.getBusinessNetwork().getFactory(), this.getBusinessNetwork().getSerializer(),this);
    }

    /**
     * Get an existing participant registry.
     * @example
     * // Get a participant registry
     * var businessNetwork = new BusinessNetworkConnection();
     * return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
     * .then(function(businessNetworkDefinition){
     *     return businessNetworkDefinition.getParticipantRegistry('businessNetworkIdentifier.registryId');
     * })
     * .then(function(participantRegistry){
     *     // Retrieved Participant Registry
     * });
     * @param {string} id - The unique identifier of the participant registry
     * @return {Promise} - A promise that will be resolved with the existing participant
     * registry, or rejected if the participant registry does not exist.
     */
    getParticipantRegistry(id) {
        Util.securityCheck(this.securityContext);
        return ParticipantRegistry.getParticipantRegistry(this.securityContext, id, this.getBusinessNetwork().getModelManager(), this.getBusinessNetwork().getFactory(), this.getBusinessNetwork().getSerializer(),this);
    }

     /**
     * Determine whether a participant registry exists.
     * @example
     * // Determine whether an asset registry exists
     * var businessNetwork = new BusinessNetworkConnection();
     * return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
     * .then(function(businessNetworkDefinition){
     *     return businessNetworkDefinition.participantRegistryExists('businessNetworkIdentifier.registryId');
     * })
     * .then(function(exists){
     *     // if (exists === true) {
     *     // logic here...
     *     //}
     * });
     * @param {string} id - The unique identifier of the participant registry
     * @return {Promise} - A promise that will be resolved with a boolean indicating whether the participant
     * registry exists.
     */
    participantRegistryExists(id) {
        Util.securityCheck(this.securityContext);
        return ParticipantRegistry.participantRegistryExists(this.securityContext, id, this.getBusinessNetwork().getModelManager(), this.getBusinessNetwork().getFactory(), this.getBusinessNetwork().getSerializer(),this);
    }

    /**
     * Add a new participant registry.
     * @example
     * // Add a new participant registry
     * var businessNetwork = new BusinessNetworkConnection();
     * return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
     * .then(function(businessNetworkDefinition){
     *     return businessNetworkDefinition.addParticipantRegistry('registryId','registryName');
     * });
     * @param {string} id - The unique identifier of the participant registry
     * @param {string} name - The name of the participant registry
     * @return {Promise} - A promise that will be resolved with the new participant
     * registry after it has been added.
     */
    addParticipantRegistry(id, name) {
        Util.securityCheck(this.securityContext);
        return ParticipantRegistry.addParticipantRegistry(this.securityContext, id, name, this.getBusinessNetwork().getModelManager(), this.getBusinessNetwork().getFactory(), this.getBusinessNetwork().getSerializer(),this);
    }

    /**
     * Get the transaction registry.
     * @example
     * // Get the transaction registry
     * var businessNetwork = new BusinessNetworkConnection();
     * return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
     * .then(function(businessNetworkDefinition){
     *     return businessNetworkDefinition.getTransactionRegistry();
     * })
     * .then(function(transactionRegistry){
     *     // Retrieved Transaction Registry
     * });
     * @return {Promise} - A promise that will be resolved to the {@link TransactionRegistry}
     */
    getTransactionRegistry() {
        Util.securityCheck(this.securityContext);
        return TransactionRegistry
            .getAllTransactionRegistries(this.securityContext, this.getBusinessNetwork().getModelManager(), this.getBusinessNetwork().getFactory(), this.getBusinessNetwork().getSerializer())
            .then((transactionRegistries) => {
                if (transactionRegistries.length >= 1) {
                    return transactionRegistries[0];
                } else {
                    throw new Error('Failed to find the default transaction registry');
                }
            });
    }

    /**
     * Get the Historian.
     * @example
     * // Get the Historian
     * var businessNetwork = new BusinessNetworkConnection();
     * return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
     * .then(function(businessNetworkDefinition){
     *     return businessNetworkDefinition.getHistorian();
     * })
     * .then(function(historian){
     *     // Retrieved Historian
     * });
     * @return {Promise} - A promise that will be resolved to the {@link Historian}
     */
    getHistorian() {
        Util.securityCheck(this.securityContext);
        return Historian
            .getAllHistorians(this.securityContext, this.getBusinessNetwork().getModelManager(), this.getBusinessNetwork().getFactory(), this.getBusinessNetwork().getSerializer())
            .then((results) => {
                if (results.length >= 1) {
                    return results[0];
                } else {
                    throw new Error('Failed to find the default transaction registry');
                }
            });
    }

    /**
     * Get the identity registry.
     * @example
     * // Get the transaction registry
     * var businessNetwork = new BusinessNetworkConnection();
     * return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
     * .then(function(businessNetworkDefinition){
     *     return businessNetworkDefinition.getIdentityRegistry();
     * })
     * .then(function(identityRegistry){
     *     // Retrieved Identity Registry
     * });
     * @return {Promise} - A promise that will be resolved to the {@link IdentityRegistry}
     */
    getIdentityRegistry() {
        Util.securityCheck(this.securityContext);
        return IdentityRegistry
            .getIdentityRegistry(this.securityContext, this.getBusinessNetwork().getModelManager(), this.getBusinessNetwork().getFactory(), this.getBusinessNetwork().getSerializer())
            .then((identityRegistry) => {
                if (identityRegistry) {
                    return identityRegistry;
                } else {
                    throw new Error('Failed to find the default identity registry');
                }
            });
    }

    /**
     * Connects to a business network using a connection profile, and authenticates to the Hyperledger Fabric.
     * @example
     * // Connect and log in to HLF
     * var businessNetwork = new BusinessNetworkConnection();
     * return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
     * .then(function(businessNetworkDefinition){
     *     // Connected
     * });
     * @param {string} connectionProfile - The name of the connection profile
     * @param {string} businessNetwork - The identifier of the business network
     * @param {string} enrollmentID the enrollment ID of the user
     * @param {string} enrollmentSecret the enrollment secret of the user
     * @param {Object} [additionalConnectOptions] Additional configuration options supplied
     * at runtime that override options set in the connection profile.
     * which will override those in the specified connection profile.
     * @return {Promise} A promise to a BusinessNetworkDefinition that indicates the connection is complete
     */
    connect(connectionProfile, businessNetwork, enrollmentID, enrollmentSecret, additionalConnectOptions) {
        const method = 'connect';
        LOG.entry(method, connectionProfile, businessNetwork, enrollmentID, enrollmentSecret, additionalConnectOptions);
        return this.connectionProfileManager.connect(connectionProfile, businessNetwork, additionalConnectOptions)
            .then((connection) => {
                connection.on('events', (events) => {
                    events.forEach((event) => {
                        let serializedEvent = this.getBusinessNetwork().getSerializer().fromJSON(event);
                        this.emit('event', serializedEvent);
                    });
                });
                this.connection = connection;
                return connection.login(enrollmentID, enrollmentSecret);
            })
            .then((securityContext) => {
                this.securityContext = securityContext;
                return this.ping();
            })
            .then(() => {
                return Util.queryChainCode(this.securityContext, 'getBusinessNetwork', []);
            })
            .then((buffer) => {
                let businessNetworkJSON = JSON.parse(buffer.toString());
                let businessNetworkArchive = Buffer.from(businessNetworkJSON.data, 'base64');
                return BusinessNetworkDefinition.fromArchive(businessNetworkArchive);
            })
            .then((businessNetwork) => {
                this.businessNetwork = businessNetwork;
                this.dynamicQueryFile = this.businessNetwork.getQueryManager().createQueryFile('$dynamic_queries.qry', '');
                LOG.exit(method);
                return this.businessNetwork;
            });
    }

    /**
     * Disconnects from the Hyperledger Fabric.
     * @example
     * // Disconnects from HLF
     * var businessNetwork = new BusinessNetworkConnection();
     * return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
     * .then(function(businessNetworkDefinition){
     *     return businessNetworkDefinition.disconnect();
     * })
     * .then(function(){
     *     // Disconnected.
     * });
     * @return {Promise} A promise that will be resolved when the connection is
     * terminated.
     */
    disconnect() {
        const method = 'disconnect';
        LOG.entry(method);
        if (!this.connection) {
            return Promise.resolve();
        }
        return this.connection.disconnect()
            .then(() => {
                this.connection.removeListener('events', () => {
                    LOG.debug(method, 'removeLisener');
                });
                this.connection = null;
                this.securityContext = null;
                this.businessNetwork = null;
                this.dynamicQueryFile = null;
                LOG.exit(method);
            });
    }

    /**
     * Submit a transaction for processing by the currently connected business network.
     * @example
     * // Submits a transaction
     * var businessNetwork = new BusinessNetworkConnection();
     * return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
     * .then(function(businessNetworkDefinition){
     *     var factory = businessNetworkDefinition.getBusinessNetwork().getFactory();
     *     var transaction = factory.newTransaction('network.transactions', 'TransactionType');
     *     return businessNetworkDefinition.submitTransaction(transaction);
     * })
     * .then(function(){
     *     // Submitted a transaction.
     * });
     * @param {Resource} transaction - The transaction to submit. Use {@link
     * Factory#newTransaction newTransaction} to create this object.
     * @return {Promise} A promise that will be fulfilled when the transaction has
     * been processed.
     */
    submitTransaction(transaction) {
        Util.securityCheck(this.securityContext);
        if (!transaction) {
            throw new Error('transaction not specified');
        }
        let classDeclaration = transaction.getClassDeclaration();
        if (!(classDeclaration instanceof TransactionDeclaration)) {
            throw new Error(classDeclaration.getFullyQualifiedName() + ' is not a transaction');
        }
        let id = transaction.getIdentifier();
        if (id === null || id === undefined) {
            id = uuid.v4();
            transaction.setIdentifier(id);
        }
        let timestamp = transaction.timestamp;
        if (timestamp === null || timestamp === undefined) {
            timestamp = transaction.timestamp = new Date();
        }
        let data = this.getBusinessNetwork().getSerializer().toJSON(transaction);
        return this.getTransactionRegistry(this.securityContext)
            .then((transactionRegistry) => {
                return Util.invokeChainCode(this.securityContext, 'submitTransaction', [transactionRegistry.id, JSON.stringify(data)]);
            });
    }

    /**
     * Build a query ready for later execution. The specified query string must be written
     * in the Composer query language.
     *
     * This functionality is Blockchain platform dependent. For example, when a Composer
     * business network is deployed to Hyperledger Fabric v1.0, Hyperledger Fabric must be
     * configured with the CouchDB database for the world state.
     * @example
     * // Build and execute a query.
     * var businessNetwork = new BusinessNetworkConnection();
     * return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
     *   .then(function () {
     *     var query = businessNetwork.buildQuery('SELECT org.acme.sample.SampleAsset WHERE (value == _$inputValue)');
     *     return businessNetwork.query(query, { inputValue: 'blue' })
     *   })
     *   .then(function (assets) {
     *     assets.forEach(function (asset) {
     *       // Process each asset.
     *     });
     *   })
     *   .catch(function (error) {
     *     // Add optional error handling here.
     *   });
     * @param {string} query The query string, written using the Composer query language.
     * @return {Query} The built query, which can be passed in a call to query.
     */
    buildQuery(query) {
        const method = 'buildQuery';
        LOG.entry(method, query);
        const builtQuery = this.dynamicQueryFile.buildQuery('Dynamic query', 'Dynamic query', query);
        builtQuery.validate();
        const result = new Query(query);
        LOG.exit(method, result);
        return result;
    }

    /**
     * Execute a query defined in a Composer query file, or execute a query built with buildQuery.
     *
     * This functionality is Blockchain platform dependent. For example, when a Composer
     * business network is deployed to Hyperledger Fabric v1.0, Hyperledger Fabric must be
     * configured with the CouchDB database for the world state.
     * @example
     * // Execute the query.
     * var businessNetwork = new BusinessNetworkConnection();
     * return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
     *   .then(function () {
     *     return query('Q1', { inputValue: 'blue' })
     *   })
     *   .then(function (assets) {
     *     assets.forEach(function (asset) {
     *       // Process each asset.
     *     });
     *   })
     *   .catch(function (error) {
     *     // Add optional error handling here.
     *   });
     * @param {string|Query} query The name of the query, or a built query.
     * @param {Object} [parameters] The parameters for the query.
     * @return {Promise} A promise that will be resolved with an array of
     * {@link module:composer-common.Resource Resource} representing the
     * resources returned by the query.
     */
    query(query, parameters) {
        const method = 'query';
        LOG.entry(method, query, parameters);
        let queryType, identifier;
        if (query instanceof Query) {
            queryType = 'build';
            identifier = query.getIdentifier();
        } else if (typeof query === 'string') {
            queryType = 'named';
            identifier = query;
        } else {
            throw new Error('Invalid query; expecting a built query or the name of a query');
        }
        parameters = parameters || {};
        return Util.queryChainCode(this.securityContext, 'executeQuery', [queryType, identifier, JSON.stringify(parameters)])
            .then((buffer) => {
                return JSON.parse(buffer.toString());
            })
            .then((resources) => {
                const result = resources.map((resource) => {
                    return this.getBusinessNetwork().getSerializer().fromJSON(resource);
                });
                LOG.exit(method, result);
                return result;
            });
    }

    /**
     * Test the connection to the runtime and verify that the version of the
     * runtime is compatible with this level of the client node.js module.
     * @example
     * // Test the connection to the runtime
     * var businessNetwork = new BusinessNetworkConnection();
     * return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
     * .then(function(businessNetworkDefinition){
     *     return businessNetwork.ping();
     * })
     * .then(function(){
     *     // Connection tested.
     * });
     * @return {Promise} A promise that will be fufilled when the connection has
     * been tested. The promise will be rejected if the version is incompatible.
     */
    ping() {
        const method = 'ping';
        LOG.entry(method);
        return this.pingInner()
            .catch((error) => {
                if (error.message.match(/ACTIVATION_REQUIRED/)) {
                    LOG.debug(method, 'Activation required, activating ...');
                    return this.activate()
                        .then(() => {
                            return this.pingInner();
                        });
                }
                throw error;
            })
            .then((result) => {
                LOG.exit(method, result);
                return result;
            });
    }

    /**
     * Test the connection to the runtime and verify that the version of the
     * runtime is compatible with this level of the client node.js module.
     * @private
     * @return {Promise} A promise that will be fufilled when the connection has
     * been tested. The promise will be rejected if the version is incompatible.
     */
    pingInner() {
        const method = 'pingInner';
        LOG.entry(method);
        Util.securityCheck(this.securityContext);
        return this.connection.ping(this.securityContext)
            .then((result) => {
                LOG.exit(method, result);
                return result;
            });
    }

    /**
     * Activate the current identity on the currently connected business network.
     * @private
     * @return {Promise} A promise that will be fufilled when the connection has
     * been tested. The promise will be rejected if the version is incompatible.
     */
    activate() {
        const method = 'activate';
        LOG.entry(method);
        const json = {
            $class: 'org.hyperledger.composer.system.ActivateCurrentIdentity',
            transactionId: uuid.v4(),
            timestamp: new Date().toISOString()
        };
        return Util.invokeChainCode(this.securityContext, 'submitTransaction', ['HistorianRegistry', JSON.stringify(json)])
            .then(() => {
                LOG.exit(method);
            });
    }

    /**
     * Issue an identity with the specified name and map it to the specified
     * participant.
     * @param {Resource|Relationship|string} participant The participant, a
     * relationship to the participant, or the fully qualified identifier of
     * the participant. The participant must already exist.
     * @param {string} identityName The name for the new identity.
     * @param {object} [options] Options for the new identity.
     * @param {boolean} [options.issuer] Whether or not the new identity should have
     * permissions to create additional new identities. False by default.
     * @return {Promise} A promise that will be fulfilled when the identity has
     * been added to the specified participant. The promise will be rejected if
     * the participant does not exist, or if the identity is already mapped to
     * another participant.
     */
    issueIdentity(participant, identityName, options) {
        const method = 'issueIdentity';
        LOG.entry(method, participant, identityName);
        if (!participant) {
            throw new Error('participant not specified');
        } else if (!identityName) {
            throw new Error('identityName not specified');
        }
        const factory = this.getBusinessNetwork().getFactory();
        if (participant instanceof Resource) {
            participant = factory.newRelationship(participant.getNamespace(), participant.getType(), participant.getIdentifier());
        } else if (participant instanceof Relationship) {
            // This is OK!
        } else {
            participant = Relationship.fromURI(this.getBusinessNetwork().getModelManager(), participant);
        }
        const transaction = factory.newTransaction('org.hyperledger.composer.system', 'IssueIdentity');
        Object.assign(transaction, {
            participant,
            identityName
        });
        return this.getParticipantRegistry(participant.getFullyQualifiedType())
            .then((participantRegistry) => {
                return participantRegistry.exists(participant.getIdentifier());
            })
            .then((exists) => {
                if (exists) {
                    return this.connection.createIdentity(this.securityContext, identityName, options);
                } else {
                    throw new Error(`Participant '${participant.getFullyQualifiedIdentifier()}' does not exist `);
                }
            })
            .then((identity) => {
                return this.submitTransaction(transaction)
                    .then(() => {
                        LOG.exit(method, identity);
                        return identity;
                    });
            });
    }

    /**
     * Bind an existing identity to the specified participant.
     * @param {Resource|string} participant The participant, or the fully qualified
     * identifier of the participant. The participant must already exist.
     * @param {string} certificate The certificate for the existing identity.
     * @return {Promise} A promise that will be fulfilled when the identity has
     * been added to the specified participant. The promise will be rejected if
     * the participant does not exist, or if the identity is already mapped to
     * another participant.
     */
    bindIdentity(participant, certificate) {
        const method = 'bindIdentity';
        LOG.entry(method, participant, certificate);
        if (!participant) {
            throw new Error('participant not specified');
        } else if (!certificate) {
            throw new Error('certificate not specified');
        }
        const factory = this.getBusinessNetwork().getFactory();
        if (participant instanceof Resource) {
            participant = factory.newRelationship(participant.getNamespace(), participant.getType(), participant.getIdentifier());
        } else if (participant instanceof Relationship) {
            // This is OK!
        } else {
            participant = Relationship.fromURI(this.getBusinessNetwork().getModelManager(), participant);
        }
        const transaction = factory.newTransaction('org.hyperledger.composer.system', 'BindIdentity');
        Object.assign(transaction, {
            participant,
            certificate
        });
        return this.submitTransaction(transaction)
            .then(() => {
                LOG.exit(method);
            });
    }

    /**
     * Revoke the specified identity by removing any existing mapping to a participant.
     * @param {Resource|string} identity The identity, or the identifier of the identity.
     * @return {Promise} A promise that will be fulfilled when the identity has
     * been removed from the specified participant. The promise will be rejected if
     * the participant does not exist, or if the identity is not mapped to the
     * participant.
     */
    revokeIdentity(identity) {
        const method = 'revokeIdentity';
        LOG.entry(method, identity);
        if (!identity) {
            throw new Error('identity not specified');
        }
        const factory = this.getBusinessNetwork().getFactory();
        if (identity instanceof Resource) {
            identity = factory.newRelationship(identity.getNamespace(), identity.getType(), identity.getIdentifier());
        } else if (identity instanceof Relationship) {
            // This is OK!
        } else {
            identity = Relationship.fromURI(this.getBusinessNetwork().getModelManager(), identity, 'org.hyperledger.composer.system', 'Identity');
        }
        const transaction = factory.newTransaction('org.hyperledger.composer.system', 'RevokeIdentity');
        Object.assign(transaction, {
            identity
        });
        // It is not currently possible to revoke the certificate, so we just call
        // the runtime to remove the mapping.
        return this.submitTransaction(transaction)
          .then(() => {
              LOG.exit(method);
          });
    }

}

module.exports = BusinessNetworkConnection;
