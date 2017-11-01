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
const ConnectionProfileManager = require('composer-common').ConnectionProfileManager;
const EventEmitter = require('events');
const fs = require('fs');
const Historian = require('./historian');
const IdentityRegistry = require('./identityregistry');
const Logger = require('composer-common').Logger;
const ParticipantRegistry = require('./participantregistry');
const Query = require('./query');
const Relationship = require('composer-common').Relationship;
const Resource = require('composer-common').Resource;
const TransactionDeclaration = require('composer-common').TransactionDeclaration;
const TransactionRegistry = require('./transactionregistry');
const Util = require('composer-common').Util;
const uuid = require('uuid');
const Registry = require('./registry');
const FileSystemCardStore = require('composer-common').FileSystemCardStore;
const LOG = Logger.getLog('BusinessNetworkConnection');

/**
 * Use this class to connect to and then interact with a deployed BusinessNetworkDefinition.
 * Use the AdminConnection class in the composer-admin module to deploy BusinessNetworksDefinitions.
 * @extends EventEmitter
 * @class
 * @memberof module:composer-client
 */
class BusinessNetworkConnection extends EventEmitter {

    /**
     * Create an instance of the BusinessNetworkConnection class.
     * must be called to connect to a deployed BusinessNetworkDefinition.
     * @param {Object} [options] - an optional set of options to configure the instance.
     * @param {BusinessNetworkCardStore} [options.cardStore] specify a card store implementation to use.
     */
    constructor (options) {
        super();
        const method = 'constructor';
        LOG.entry(method, options);
        options = options || {};

        this.cardStore = options.cardStore || new FileSystemCardStore({fs : options.fs || fs});

        this.connectionProfileManager = new ConnectionProfileManager();
        this.connection = null;
        this.securityContext = null;
        this.businessNetwork = null;
        this.dynamicQueryFile = null;
        this.card = null;
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
    getBusinessNetwork () {
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
     * @return {Promise} - A promise that will be resolved with a list of existing
     * asset registries
     * @param {boolean} [includeSystem] if true the returned list will include the system transaction registries (optional, default to false)
     */
    getAllAssetRegistries (includeSystem) {
        Util.securityCheck(this.securityContext);
        let sysReg = includeSystem || false;
        return AssetRegistry.getAllAssetRegistries(this.securityContext, this.getBusinessNetwork().getModelManager(), this.getBusinessNetwork().getFactory(), this.getBusinessNetwork().getSerializer(), this, sysReg);
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
    getAssetRegistry (id) {
        Util.securityCheck(this.securityContext);
        return AssetRegistry.getAssetRegistry(this.securityContext, id, this.getBusinessNetwork().getModelManager(), this.getBusinessNetwork().getFactory(), this.getBusinessNetwork().getSerializer(), this);
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
    assetRegistryExists (id) {
        Util.securityCheck(this.securityContext);
        return AssetRegistry.assetRegistryExists(this.securityContext, id, this.getBusinessNetwork().getModelManager(), this.getBusinessNetwork().getFactory(), this.getBusinessNetwork().getSerializer(), this);
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
    addAssetRegistry (id, name) {
        Util.securityCheck(this.securityContext);
        return AssetRegistry.addAssetRegistry(this.securityContext, id, name, this.getBusinessNetwork().getModelManager(), this.getBusinessNetwork().getFactory(), this.getBusinessNetwork().getSerializer(), this);
    }

    /**
     * Get a list of all existing participant registries.
     * @example
     * // Get all participant registries
     * var businessNetwork = new BusinessNetworkConnection();
     * return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
     * .then(function(businessNetworkDefinition){
     *     return businessNetworkDefinition.getAllParticipantRegistries();
     * })
     * .then(function(participantRegistries){
     *     // Retrieved Participant Registries
     * });
     *
     * @return {Promise} - A promise that will be resolved with a list of existing
     * participant registries
     * @param {boolean} [includeSystem] if true the returned list will include the system transaction registries (optional, default to false)
     */
    getAllParticipantRegistries (includeSystem) {
        Util.securityCheck(this.securityContext);
        let sysReg = includeSystem || false;
        return ParticipantRegistry.getAllParticipantRegistries(this.securityContext, this.getBusinessNetwork().getModelManager(), this.getBusinessNetwork().getFactory(), this.getBusinessNetwork().getSerializer(), this, sysReg);
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
    getParticipantRegistry (id) {
        Util.securityCheck(this.securityContext);
        return ParticipantRegistry.getParticipantRegistry(this.securityContext, id, this.getBusinessNetwork().getModelManager(), this.getBusinessNetwork().getFactory(), this.getBusinessNetwork().getSerializer(), this);
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
    participantRegistryExists (id) {
        Util.securityCheck(this.securityContext);
        return ParticipantRegistry.participantRegistryExists(this.securityContext, id, this.getBusinessNetwork().getModelManager(), this.getBusinessNetwork().getFactory(), this.getBusinessNetwork().getSerializer(), this);
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
    addParticipantRegistry (id, name) {
        Util.securityCheck(this.securityContext);
        return ParticipantRegistry.addParticipantRegistry(this.securityContext, id, name, this.getBusinessNetwork().getModelManager(), this.getBusinessNetwork().getFactory(), this.getBusinessNetwork().getSerializer(), this);
    }

    /**
     * Get the transaction registry.
     * @example
     * // Get the transaction registry
     * var businessNetwork = new BusinessNetworkConnection();
     * return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
     * .then(function(businessNetworkDefinition){
     *     return businessNetworkDefinition.getTransactionRegistry('org.acme.exampleTransaction');
     * })
     * .then(function(transactionRegistry){
     *     // Retrieved transaction registry.
     * });
     * @param {string} id - The unique identifier of the transaction registry
     * @return {Promise} - A promise that will be resolved to the {@link TransactionRegistry}
     */
    getTransactionRegistry (id) {
        Util.securityCheck(this.securityContext);
        return TransactionRegistry.getTransactionRegistry(this.securityContext, id, this.getBusinessNetwork().getModelManager(), this.getBusinessNetwork().getFactory(), this.getBusinessNetwork().getSerializer(), this);
    }

    /**
     * Get all transaction registries.
     * @example
     * // Get the transaction registry
     * var businessNetwork = new BusinessNetworkConnection();
     * return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
     * .then(function(businessNetworkDefinition){
     *     return businessNetworkDefinition.getAllTransactionRegistries();
     * })
     * .then(function(transactionRegistries){
     *     // Retrieved transaction Registries
     * });
     * @param {boolean} [includeSystem] if true the returned list will include the system transaction registries (optional, default to false)
     * @return {Promise} - A promise that will be resolved to the {@link TransactionRegistry}
     */
    getAllTransactionRegistries (includeSystem) {
        Util.securityCheck(this.securityContext);
        let sysReg = includeSystem || false;
        return TransactionRegistry.getAllTransactionRegistries(this.securityContext, this.getBusinessNetwork().getModelManager(), this.getBusinessNetwork().getFactory(), this.getBusinessNetwork().getSerializer(), this, sysReg);
    }


    /**
     * Determine whether a transaction registry exists.
     * @example
     * // Determine whether an transaction registry exists
     * var businessNetwork = new BusinessNetworkConnection();
     * return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
     * .then(function(businessNetwork){
     *     return businessNetwork.transactionRegistryExists('businessNetworkIdentifier.registryId');
     * })
     * .then(function(exists){
     *     // if (exists === true) {
     *     // logic here...
     *     //}
     * });
     * @param {string} id - The unique identifier of the transaction registry
     * @return {Promise} - A promise that will be resolved with a boolean indicating whether the transaction
     * registry exists.
     */
    transactionRegistryExists (id) {
        Util.securityCheck(this.securityContext);
        return TransactionRegistry.transactionRegistryExists(this.securityContext, id, this.getBusinessNetwork().getModelManager(), this.getBusinessNetwork().getFactory(), this.getBusinessNetwork().getSerializer(), this);
    }


    /**
     * Get the historian
     * @example
     * // Get the historian
     * var businessNetwork = new BusinessNetworkConnection();
     * return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
     * .then(function(businessNetworkDefinition){
     *     return businessNetworkDefinition.getHistorian();
     * })
     * .then(function(historian){
     *     // Retrieved historian
     * });
     * @return {Promise} - A promise that will be resolved to the {@link Historian}
     */
    getHistorian () {
        Util.securityCheck(this.securityContext);
        return Historian
            .getHistorian(this.securityContext, this.getBusinessNetwork().getModelManager(), this.getBusinessNetwork().getFactory(), this.getBusinessNetwork().getSerializer())
            .then((historian) => {
                if (historian) {
                    return historian;
                } else {
                    throw new Error('Failed to find the historian');
                }
            });
    }

    /**
     * Get the identity registry.
     * @example
     * // Get the identity registry
     * var businessNetwork = new BusinessNetworkConnection();
     * return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
     * .then(function(businessNetworkDefinition){
     *     return businessNetworkDefinition.getIdentityRegistry();
     * })
     * .then(function(identityRegistry){
     *     // Retrieved identity registry
     * });
     * @return {Promise} - A promise that will be resolved to the {@link IdentityRegistry}
     */
    getIdentityRegistry () {
        Util.securityCheck(this.securityContext);
        return IdentityRegistry
            .getIdentityRegistry(this.securityContext, this.getBusinessNetwork().getModelManager(), this.getBusinessNetwork().getFactory(), this.getBusinessNetwork().getSerializer())
            .then((identityRegistry) => {
                if (identityRegistry) {
                    return identityRegistry;
                } else {
                    throw new Error('Failed to find the identity registry');
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
     * @param {string} enrollmentID the enrolment ID of the user
     * @param {string} enrollmentSecret the enrolment secret of the user
     * @param {Object} [additionalConnectOptions] Additional configuration options supplied
     * at runtime that override options set in the connection profile.
     * which will override those in the specified connection profile.
     * @return {Promise} A promise to a BusinessNetworkDefinition that indicates the connection is complete
     * @private
     */
    connectWithDetails (connectionProfile, businessNetwork, enrollmentID, enrollmentSecret, additionalConnectOptions) {
        const method = '_connect';
        LOG.entry(method, connectionProfile, businessNetwork, enrollmentID, enrollmentSecret, additionalConnectOptions);

        return this.connectionProfileManager.connect(connectionProfile, businessNetwork, additionalConnectOptions)
            .then((connection) => {
                LOG.exit(method);
                return this._connectionLogin(connection, enrollmentID, enrollmentSecret);
            });

    }

    /**
     * Connects to a business network using a business network card, and authenticates to the Hyperledger Fabric.
     * @example
     * // Connect and log in to HLF
     * var businessNetwork = new BusinessNetworkConnection();
     * return businessNetwork.connect('cardName')
     * .then(function(businessNetworkDefinition){
     *     // Connected
     * });
     * @param {String} cardName  businessNetworkCard Name (must have been imported already)
     * @param {Object} [additionalConnectOptions] Additional configuration options supplied
     * at runtime that override options set in the connection profile.
     * which will override those in the specified connection profile.
     * @return {Promise} A promise to a BusinessNetworkDefinition that indicates the connection is complete
     */
    connect (cardName, additionalConnectOptions) {
        const method = 'connectWithCard';
        LOG.entry(method, cardName);

        return this.cardStore.get(cardName)
            .then((retrievedCard) => {
                this.card = retrievedCard;
                if (!additionalConnectOptions) {
                    additionalConnectOptions = {};
                }
                additionalConnectOptions.cardName = cardName;
                return this.connectionProfileManager.connectWithData(this.card.getConnectionProfile(), this.card.getBusinessNetworkName(), additionalConnectOptions);
            })
            .then((connection) => {
                LOG.exit(method);

                let secret = this.card.getEnrollmentCredentials();
                if (!secret) {
                    secret = 'na';
                } else {
                    secret = secret.secret;
                }

                return this._connectionLogin(connection, this.card.getUserName(), secret);

            });

    }

    /**
     * Get the business network card used by this connection, if a business network card was used.
     * @return {IdCard} The business network card used by this connection, or null if a business
     * network card was not used.
     * @private
     */
    getCard () {
        return this.card;
    }

    /**
     * Internal method to login and process the connection
     * @private
     * @param {Connection} connection connection just established
     * @param {String} enrollId enrollment id
     * @param {String} enrollmentSecret enrollment secret
     * @return {Promise} resolved promise to a BusinessNetworkDefinition when complete
     *
     */
    _connectionLogin (connection, enrollId, enrollmentSecret) {
        const method = '_connectionLogin';
        LOG.entry(method);

        return Promise.resolve()
            .then(() => {
                connection.on('events', (events) => {
                    events.forEach((event) => {
                        let serializedEvent = this.getBusinessNetwork().getSerializer().fromJSON(event);
                        this.emit('event', serializedEvent);
                    });
                });
                this.connection = connection;
                return connection.login(enrollId, enrollmentSecret);
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
     * Given a fully qualified name, works out and looks up the registry that this resource will be found in.
     * This only gives back the default registry - it does not look in any application defined registry.
     * @example
     * // Locate the registry for a fully qualififed name
     * var businessNetwork = new BusinessNetworkConnection();
     * return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
     * .then(function(businessNetwork){
     *     var sampleAssetRegistry = businessNetwork.getRegistry('org.acme.sampleAsset');
     *     var sampleTransactionRegistry = businessNetwork.getRegistry('org.acme.sampleTransaction');
     *      var sampleParticipantRegistry = businessNetwork.getRegistry('org.acme.sampleParticipant');
     * });
     * @param {String} fullyQualifiedName The fully qualified name of the resources
     * @return {Promise} resolved with the registry that this fqn could be found in by default
     */
    getRegistry (fullyQualifiedName) {
        Util.securityCheck(this.securityContext);
        let businessNetwork = this.getBusinessNetwork();
        let type = businessNetwork.getModelManager().getType(fullyQualifiedName).getSystemType();
        return Registry.getRegistry(this.securityContext, type, fullyQualifiedName)
            .then((registry) => {
                switch (type) {
                case 'Transaction':
                    return new TransactionRegistry(registry.id, registry.name, this.securityContext, businessNetwork.getModelManager(), businessNetwork.getFactory(), businessNetwork.getSerializer());
                case 'Asset':
                    return new AssetRegistry(registry.id, registry.name, this.securityContext, businessNetwork.getModelManager(), businessNetwork.getFactory(), businessNetwork.getSerializer());
                case 'Participant':
                    return new ParticipantRegistry(registry.id, registry.name, this.securityContext, businessNetwork.getModelManager(), businessNetwork.getFactory(), businessNetwork.getSerializer());
                }
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
    disconnect () {
        const method = 'disconnect';
        LOG.entry(method);
        if (!this.connection) {
            return Promise.resolve();
        }
        return this.connection.disconnect()
            .then(() => {
                this.connection.removeListener('events', () => {
                    LOG.debug(method, 'removeListener');
                });
                this.connection = null;
                this.securityContext = null;
                this.businessNetwork = null;
                this.dynamicQueryFile = null;
                this.card = null;
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
        * common-Factory#newTransaction newTransaction} to create this object.
     * @return {Promise} A promise that will be fulfilled when the transaction has
     * been processed.
     */
    submitTransaction (transaction) {
        Util.securityCheck(this.securityContext);
        if (!transaction) {
            throw new Error('transaction not specified');
        }
        let classDeclaration = transaction.getClassDeclaration();
        if (!(classDeclaration instanceof TransactionDeclaration)) {
            throw new Error(classDeclaration.getFullyQualifiedName() + ' is not a transaction');
        }

        return Util.createTransactionId(this.securityContext)
            .then((id) => {
                transaction.setIdentifier(id.idStr);
                transaction.timestamp = new Date();
                let data = this.getBusinessNetwork().getSerializer().toJSON(transaction);
                return Util.invokeChainCode(this.securityContext, 'submitTransaction', [JSON.stringify(data)], {transactionId : id.id});
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
    buildQuery (query) {
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
    query (query, parameters) {
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
     * @return {Promise} A promise that will be fulfilled when the connection has
     * been tested. The promise will be rejected if the version is incompatible.
     */
    ping () {
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
     * @return {Promise} A promise that will be fulfilled when the connection has
     * been tested. The promise will be rejected if the version is incompatible.
     */
    pingInner () {
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
     * @return {Promise} A promise that will be fulfilled when the connection has
     * been tested. The promise will be rejected if the version is incompatible.
     */
    activate () {
        const method = 'activate';
        LOG.entry(method);
        const json = {
            $class : 'org.hyperledger.composer.system.ActivateCurrentIdentity',
            transactionId : uuid.v4(),
            timestamp : new Date().toISOString()
        };
        return Util.invokeChainCode(this.securityContext, 'submitTransaction', [JSON.stringify(json)])
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
    issueIdentity (participant, identityName, options) {
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
    bindIdentity (participant, certificate) {
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
    revokeIdentity (identity) {
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
