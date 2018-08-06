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
const Registry = require('./registry');
const NetworkCardStoreManager = require('composer-common').NetworkCardStoreManager;
const LOG = Logger.getLog('BusinessNetworkConnection');

/**
 * Use this class to connect to and then interact with a deployed
 * {@link module:composer-common.BusinessNetworkDefinition Business Network Definition}.
 * Use the AdminConnection class in the composer-admin module to deploy
 * BusinessNetworksDefinitions.
 * @extends EventEmitter
 * @class
 * @memberof module:composer-client
 */
class BusinessNetworkConnection extends EventEmitter {

    /**
     * Creates an instance of the BusinessNetworkConnection class.
     * Must be called to connect to a deployed BusinessNetworkDefinition.
     * @param {Object} [options] - an optional set of options to configure the
     * instance.
     * @param {BusinessNetworkCardStore} [options.cardStore] specify a card
     * store implementation to use.
     */
    constructor(options) {
        super();
        const method = 'constructor';
        LOG.entry(method, options);
        options = options || {};

        this.cardStore = options.cardStore || NetworkCardStoreManager.getCardStore(options.wallet);
        this.connectionProfileManager = new ConnectionProfileManager();
        this.connection = null;
        this.securityContext = null;
        this.businessNetwork = null;
        this.dynamicQueryFile = null;
        this.card = null;
    }

    /**
     * Gets the currently connected business network.
     * {@link module:composer-common.BusinessNetworkDefinition Business Network Definition}.
     * @example
     * const connection = new BusinessNetworkConnection();
     * const definition = await connection.connect('admin@network-name');
     * console.log(definition === connection.getBusinessNetwork());  // true
     * @returns {BusinessNetworkDefinition} the business network definition
     */
    getBusinessNetwork() {
        return this.businessNetwork;
    }


    /**
     * Gets a list of all existing asset registries.
     * @example
     * const connection = new BusinessNetworkConnection();
     * await connection.connect('admin@network-name');
     * const assetRegistries = await connection.getAllAssetRegistries();
     * @param {boolean} [includeSystem] if true the returned list will include
     * the system transaction registries (optional, default to false)
     * @returns {Promise} - A promise that will be resolved with a list of
     * existing {@link AssetRegistry asset registries}.
     */
    getAllAssetRegistries(includeSystem) {
        Util.securityCheck(this.securityContext);
        let sysReg = includeSystem || false;
        return AssetRegistry.getAllAssetRegistries(this.securityContext, this.getBusinessNetwork().getModelManager(), this.getBusinessNetwork().getFactory(), this.getBusinessNetwork().getSerializer(), this, sysReg);
    }

    /**
     * Gets an existing asset registry.
     * @example
     * const connection = new BusinessNetworkConnection();
     * await connection.connect('admin@network-name');
     * const sampleAssetRegistry = await connection.getAssetRegistry('org.example.SampleAsset');
     * @param {string} id - The unique identifier of the asset registry
     * @returns {Promise} - A promise that will be resolved with the existing
     * {@link AssetRegistry}, or rejected if it does not exist.
     */
    getAssetRegistry(id) {
        Util.securityCheck(this.securityContext);
        return AssetRegistry.getAssetRegistry(this.securityContext, id, this.getBusinessNetwork().getModelManager(), this.getBusinessNetwork().getFactory(), this.getBusinessNetwork().getSerializer(), this);
    }

    /**
     * Determines whether an asset registry exists.
     * @example
     * const connection = new BusinessNetworkConnection();
     * await connection.connect('admin@network-name');
     * const exists = await connection.assetRegistryExists('org.example.SampleAsset');
     * if (exists) {
     *     // logic here...
     * }
     * @param {string} id - The unique identifier of the asset registry
     * @returns {Promise} - A promise that will be resolved with a boolean
     * indicating whether the {@link AssetRegistry} exists.
     */
    assetRegistryExists(id) {
        Util.securityCheck(this.securityContext);
        return AssetRegistry.assetRegistryExists(this.securityContext, id, this.getBusinessNetwork().getModelManager(), this.getBusinessNetwork().getFactory(), this.getBusinessNetwork().getSerializer(), this);
    }

    /**
     * Adds a new asset registry.
     * @example
     * const connection = new BusinessNetworkConnection();
     * await connection.connect('admin@network-name');
     * await connection.addAssetRegistry('registryId', 'registryName');
     * @param {string} id - The unique identifier of the asset registry
     * @param {string} name - The name of the asset registry
     * @returns {Promise} - A promise that will be resolved with the new
     * {@link AssetRegistry} after it has been added.
     */
    addAssetRegistry(id, name) {
        Util.securityCheck(this.securityContext);
        return AssetRegistry.addAssetRegistry(this.securityContext, id, name, this.getBusinessNetwork().getModelManager(), this.getBusinessNetwork().getFactory(), this.getBusinessNetwork().getSerializer(), this);
    }


    /**
     * Gets a list of all existing participant registries.
     * @example
     * const connection = new BusinessNetworkConnection();
     * await connection.connect('admin@network-name');
     * const participantRegistries = await connection.getAllParticipantRegistries();
     * @param {boolean} [includeSystem] if true the returned list will include
     * the system transaction registries (optional, default to false)
     * @returns {Promise} - A promise that will be resolved with a list of
     * existing {@link ParticipantRegistry participant registries}.
     */
    getAllParticipantRegistries(includeSystem) {
        Util.securityCheck(this.securityContext);
        let sysReg = includeSystem || false;
        return ParticipantRegistry.getAllParticipantRegistries(this.securityContext, this.getBusinessNetwork().getModelManager(), this.getBusinessNetwork().getFactory(), this.getBusinessNetwork().getSerializer(), this, sysReg);
    }

    /**
     * Gets an existing participant registry.
     * @example
     * const connection = new BusinessNetworkConnection();
     * await connection.connect('admin@network-name');
     * const sampleParticipantRegistry = await connection.getParticipantRegistry('org.example.SampleParticipant');
     * @param {string} id - The unique identifier of the participant registry
     * @returns {Promise} - A promise that will be resolved with the existing
     * {@link ParticipantRegistry}, or rejected if it does not exist.
     */
    getParticipantRegistry(id) {
        Util.securityCheck(this.securityContext);
        return ParticipantRegistry.getParticipantRegistry(this.securityContext, id, this.getBusinessNetwork().getModelManager(), this.getBusinessNetwork().getFactory(), this.getBusinessNetwork().getSerializer(), this);
    }

    /**
     * Determines whether a participant registry exists.
     * @example
     * const connection = new BusinessNetworkConnection();
     * await connection.connect('admin@network-name');
     * const exists = await connection.participantRegistryExists('org.example.SampleParticipant');
     * if (exists) {
     *     // logic here...
     * }
     * @param {string} id - The unique identifier of the participant registry
     * @returns {Promise} - A promise that will be resolved with a boolean
     * indicating whether the {@link ParticipantRegistry} exists.
     */
    participantRegistryExists(id) {
        Util.securityCheck(this.securityContext);
        return ParticipantRegistry.participantRegistryExists(this.securityContext, id, this.getBusinessNetwork().getModelManager(), this.getBusinessNetwork().getFactory(), this.getBusinessNetwork().getSerializer(), this);
    }

    /**
     * Adds a new participant registry.
     * @example
     * const connection = new BusinessNetworkConnection();
     * await connection.connect('admin@network-name');
     * await connection.addParticipantRegistry('registryId', 'registryName');
     * @param {string} id - The unique identifier of the participant registry
     * @param {string} name - The name of the participant registry
     * @returns {Promise} - A promise that will be resolved with the new
     * {@link ParticipantRegistry} after it has been added.
     */
    addParticipantRegistry(id, name) {
        Util.securityCheck(this.securityContext);
        return ParticipantRegistry.addParticipantRegistry(this.securityContext, id, name, this.getBusinessNetwork().getModelManager(), this.getBusinessNetwork().getFactory(), this.getBusinessNetwork().getSerializer(), this);
    }


    /**
     * Gets an existing transaction registry.
     * @example
     * const connection = new BusinessNetworkConnection();
     * await connection.connect('admin@network-name');
     * const sampleTransactionRegistry = await connection.getTransactionRegistry('org.example.SampleTransaction');
     * @param {string} id - The unique identifier of the transaction registry
     * @returns {Promise} - A promise that will be resolved with the existing
     * {@link TransactionRegistry}, or rejected if it does not exist.
     */
    getTransactionRegistry(id) {
        Util.securityCheck(this.securityContext);
        return TransactionRegistry.getTransactionRegistry(this.securityContext, id, this.getBusinessNetwork().getModelManager(), this.getBusinessNetwork().getFactory(), this.getBusinessNetwork().getSerializer(), this);
    }

    /**
     * Gets a list of all existing transaction registries.
     * @example
     * const connection = new BusinessNetworkConnection();
     * await connection.connect('admin@network-name');
     * const transactionRegistries = await connection.getAllTransactionRegistries();
     * @param {boolean} [includeSystem] if true the returned list will include
     * the system transaction registries (optional, default to false)
     * @returns {Promise} - A promise that will be resolved with a list of
     * existing {@link TransactionRegistry transaction registries}.
     */
    getAllTransactionRegistries(includeSystem) {
        Util.securityCheck(this.securityContext);
        let sysReg = includeSystem || false;
        return TransactionRegistry.getAllTransactionRegistries(this.securityContext, this.getBusinessNetwork().getModelManager(), this.getBusinessNetwork().getFactory(), this.getBusinessNetwork().getSerializer(), this, sysReg);
    }

    /**
     * Determines whether a transaction registry exists.
     * @example
     * const connection = new BusinessNetworkConnection();
     * await connection.connect('admin@network-name');
     * const exists = await connection.transactionRegistryExists('org.example.SampleTransaction');
     * if (exists) {
     *     // logic here...
     * }
     * @param {string} id - The unique identifier of the transaction registry
     * @returns {Promise} - A promise that will be resolved with a boolean
     * indicating whether the {@link TransactionRegistry} exists.
     */
    transactionRegistryExists(id) {
        Util.securityCheck(this.securityContext);
        return TransactionRegistry.transactionRegistryExists(this.securityContext, id, this.getBusinessNetwork().getModelManager(), this.getBusinessNetwork().getFactory(), this.getBusinessNetwork().getSerializer(), this);
    }


    /**
     * Gets the historian.
     * @example
     * const connection = new BusinessNetworkConnection();
     * await connection.connect('admin@network-name');
     * const historian = await connection.getHistorian();
     * @returns {Promise} - A promise that will be resolved with the
     * {@link Historian}.
     */
    getHistorian() {
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
     * Gets the identity registry.
     * @example
     * const connection = new BusinessNetworkConnection();
     * await connection.connect('admin@network-name');
     * const identityRegistry = await connection.getIdentityRegistry();
     * @returns {Promise} - A promise that will be resolved with the
     * {@link IdentityRegistry}.
     */
    getIdentityRegistry() {
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
     * Connects to a business network using a business network card, and
     * authenticates to the Hyperledger Fabric.
     * @example
     * const connection = new BusinessNetworkConnection();
     * const definition = await connection.connect('admin@network-name');
     * @param {String} cardName  businessNetworkCard Name (must have been
     * imported already)
     * @param {Object} [additionalConnectOptions] Additional configuration
     * options supplied at runtime that override options set in the connection
     * profile, which will override those in the specified connection profile.
     * @returns {Promise} A promise that will be resolved with a
     * {@link module:composer-common.BusinessNetworkDefinition BusinessNetworkDefinition}
     * that indicates the connection is completed.
     */
    async connect(cardName, additionalConnectOptions) {
        const method = 'connect';
        LOG.entry(method, cardName, additionalConnectOptions);

        this.card = await this.cardStore.get(cardName);
        if (!additionalConnectOptions) {
            additionalConnectOptions = {};
        }

        // need to get from the cardstore, a wallet that uses the same backing store
        const wallet = await this.cardStore.getWallet(cardName);
        additionalConnectOptions.wallet = wallet;
        additionalConnectOptions.cardName = cardName;
        const connection = await this.connectionProfileManager.connectWithData(this.card.getConnectionProfile(), this.card.getBusinessNetworkName(), additionalConnectOptions);

        let secret = this.card.getEnrollmentCredentials();
        if (!secret) {
            secret = 'na';
        } else {
            secret = secret.secret;
        }

        const businessNetworkDefinition = await this._connectionLogin(connection, this.card.getUserName(), secret);
        LOG.exit(method, businessNetworkDefinition);
        return businessNetworkDefinition;
    }

    /**
     * Get the business network card used by this connection, if a business
     * network card was used.
     * @returns {IdCard} The business network card (an instance of
     * {@link module:composer-common.IdCard IdCard}) used by this connection,
     * or null if a business network card was not used.
     * @private
     */
    getCard() {
        return this.card;
    }

    /**
     * Internal method to login and process the connection.
     * @private
     * @param {Connection} connection connection just established (an instance
     * of {@link module:composer-common.Connection Connection})
     * @param {string} enrollId enrollment id
     * @param {string} enrollmentSecret enrollment secret
     * @returns {Promise} A promise that will be resolved with a
     * {@link module:composer-common.BusinessNetworkDefinition BusinessNetworkDefinition}
     * when completed.
     */
    _connectionLogin(connection, enrollId, enrollmentSecret) {
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
     * Given a fully qualified name, works out and looks up the registry that
     * this resource will be found in.
     * This only gives back the default registry - it does not look in any
     * application defined registry.
     * @example
     * const connection = new BusinessNetworkConnection();
     * await connection.connect('admin@network-name');
     * const sampleAssetRegistry = await connection.getRegistry('org.example.SampleAsset');
     * const sampleParticipantRegistry = await connection.getRegistry('org.example.SampleParticipant');
     * const sampleTransactionRegistry = await connection.getRegistry('org.example.SampleTransaction');
     * @param {String} fullyQualifiedName The fully qualified name of the
     * resource registry
     * @returns {Promise} A promise that will be resolved with the registry that
     * this fully qualified name could be found in by default.
     */
    getRegistry(fullyQualifiedName) {
        Util.securityCheck(this.securityContext);
        let businessNetwork = this.getBusinessNetwork();
        let type = businessNetwork.getModelManager().getType(fullyQualifiedName).getSystemType();
        return Registry.getRegistry(this.securityContext, type, fullyQualifiedName)
            .then((registry) => {
                switch (type) {
                case 'Transaction':
                    return new TransactionRegistry(registry.id,
                        registry.name,
                        this.securityContext,
                        businessNetwork.getModelManager(),
                        businessNetwork.getFactory(),
                        businessNetwork.getSerializer(),
                        this);
                case 'Asset':
                    return new AssetRegistry(registry.id,
                        registry.name,
                        this.securityContext,
                        businessNetwork.getModelManager(),
                        businessNetwork.getFactory(),
                        businessNetwork.getSerializer(),
                        this);
                case 'Participant':
                    return new ParticipantRegistry(registry.id,
                        registry.name,
                        this.securityContext,
                        businessNetwork.getModelManager(),
                        businessNetwork.getFactory(),
                        businessNetwork.getSerializer(),
                        this);
                }
            });

    }

    /**
     * Disconnects from the Hyperledger Fabric.
     * @example
     * const connection = new BusinessNetworkConnection();
     * await connection.connect('admin@network-name');
     * // Connected.
     * await connection.disconnect();
     * // Disconnected.
     * @returns {Promise} A promise that will be resolved when the connection is
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
     * Submit a transaction for processing by the currently connected business
     * network.
     * @example
     * const connection = new BusinessNetworkConnection();
     * const definition = await connection.connect('admin@network-name');
     * const factory = definition.getFactory();
     * const transaction = factory.newTransaction('org.example', 'SampleTransaction');
     * await connection.submitTransaction(transaction);
     * @param {Resource} transaction - The transaction to submit. Use
     * {@link module:composer-common.Factory#newTransaction newTransaction} to
     * create this object.
     * @param {Object} [additionalConnectorOptions] Additional connector specific options for this transaction.
     * @returns {Promise} A promise that will be fulfilled when the transaction
     * has been processed.
     */
    async submitTransaction(transaction, additionalConnectorOptions = {}) {
        const method = 'submitTransaction';
        LOG.entry(method, transaction);
        Util.securityCheck(this.securityContext);

        // Ensure a transaction was specified, and that it is a transaction.
        if (!transaction) {
            throw new Error('transaction not specified');
        }
        let classDeclaration = transaction.getClassDeclaration();
        if (!(classDeclaration instanceof TransactionDeclaration)) {
            throw new Error(classDeclaration.getFullyQualifiedName() + ' is not a transaction');
        }

        // Set the current timestamp.
        transaction.timestamp = new Date();

        // Determine whether or not we want to commit this transaction.
        const transactionDeclaration = transaction.getClassDeclaration();
        const commitDecorator = transactionDeclaration.getDecorator('commit');
        const commit = commitDecorator ? commitDecorator.getValue() : true;

        // Submit the transaction.
        const data = await Util.submitTransaction(this.securityContext, transaction, this.getBusinessNetwork().getSerializer(), Object.assign({ commit }, additionalConnectorOptions));

        // Process the return data.
        const result = this._processReturnData(transaction, data);
        LOG.exit(method, result);
        return result;
    }

    /**
     * Process the return data for the specified transaction.
     * @private
     * @param {Resource} transaction The transaction.
     * @param {Buffer} data The return data.
     * @return {*} The processed return data.
     */
    _processReturnData(transaction, data) {
        const method = '_processReturnData';
        LOG.entry(method, transaction, data);

        // Determine whether or not a result was expected.
        const transactionDeclaration = transaction.getClassDeclaration();
        const returnsDecorator = transactionDeclaration.getDecorator('returns');
        if (!returnsDecorator) {
            LOG.exit(method, undefined);
            return undefined;
        }

        // Ensure some data was returned.
        const returnValueType = returnsDecorator.getType();
        const isArray = returnsDecorator.isArray();
        const formattedExpectedType = `${returnValueType}${isArray ? '[]' : ''}`;
        if (!data) {
            const error = new Error(`A return value of type ${formattedExpectedType} was expected for transaction ${transaction.getFullyQualifiedIdentifier()}, but nothing was returned by any functions`);
            LOG.error(method, error);
            throw error;
        }

        // Handle enum return values.
        if (returnsDecorator.isTypeEnum()) {
            const result = this._processEnumReturnData(transaction, data);
            LOG.exit(method, result);
            return result;
        }

        // Handle non-primitive return values.
        if (!returnsDecorator.isPrimitive()) {
            const result = this._processComplexReturnData(transaction, data);
            LOG.exit(method, result);
            return result;
        }

        // Handle primitive return values.
        const result = this._processPrimitiveReturnData(transaction, data);
        LOG.exit(method, result);
        return result;
    }

    /**
     * Process the complex return data for the specified transaction.
     * @private
     * @param {Resource} transaction The transaction.
     * @param {Buffer} data The return data.
     * @return {*} The processed return data.
     */
    _processComplexReturnData(transaction, data) {
        const method = '_processComplexReturnData';
        LOG.entry(method, transaction, data);

        // Get the type and resolved type.
        const transactionDeclaration = transaction.getClassDeclaration();
        const returnsDecorator = transactionDeclaration.getDecorator('returns');
        const returnValueType = returnsDecorator.getType();
        const isArray = returnsDecorator.isArray();
        const formattedExpectedType = `${returnValueType}${isArray ? '[]' : ''}`;

        // Parse the data, it should be a JSON object or array.
        let json;
        try {
            json = JSON.parse(data.toString());
        } catch (ignored) {
            const error = new Error(`A return value of type ${formattedExpectedType} was expected for transaction ${transaction.getFullyQualifiedIdentifier()}, but the data returned was not valid JSON`);
            LOG.error(method, error);
            throw error;
        }
        const serializer = this.getBusinessNetwork().getSerializer();

        // Process the return value.
        const processComplexReturnDataInner = (item) => {
            let typed;
            try {
                typed = serializer.fromJSON(item);
            } catch (ignored) {
                const error = new Error(`A return value of type ${formattedExpectedType} was expected for transaction ${transaction.getFullyQualifiedIdentifier()}, but a non-typed value was returned`);
                LOG.error(method, error);
                throw error;
            }
            if (!typed.instanceOf(returnsDecorator.getResolvedType().getFullyQualifiedName())) {
                const actualReturnValueType = typed.getType();
                const error = new Error(`A return value of type ${formattedExpectedType} was expected for transaction ${transaction.getFullyQualifiedIdentifier()}, but a value of type ${actualReturnValueType} was returned`);
                LOG.error(method, error);
                throw error;
            }
            return typed;
        };

        // Handle the non-array case - a single return value.
        if (!returnsDecorator.isArray()) {
            const result = processComplexReturnDataInner(json);
            LOG.exit(method, result);
            return result;
        }

        // This is the array case - ensure the return value is an array.
        if (!Array.isArray(json)) {
            const actualReturnValueType = typeof actualReturnValue;
            const error = new Error(`A return value of type ${formattedExpectedType} was expected for transaction ${transaction.getFullyQualifiedIdentifier()}, but a value of type ${actualReturnValueType} was returned`);
            LOG.error(method, error);
            throw error;
        }
        const result = json.map(item => processComplexReturnDataInner(item));
        LOG.exit(method, result);
        return result;
    }

    /**
     * Process the enum return data for the specified transaction.
     * @private
     * @param {Resource} transaction The transaction.
     * @param {Buffer} data The return data.
     * @return {*} The processed return data.
     */
    _processEnumReturnData(transaction, data) {
        const method = '_processEnumReturnData';
        LOG.entry(method, transaction, data);

        // Get the type and resolved type.
        const transactionDeclaration = transaction.getClassDeclaration();
        const returnsDecorator = transactionDeclaration.getDecorator('returns');
        const returnValueType = returnsDecorator.getType();
        const returnValueResolvedType = returnsDecorator.getResolvedType();
        const validEnumValues = returnValueResolvedType.getProperties().map(enumValueProperty => enumValueProperty.getName());
        const isArray = returnsDecorator.isArray();
        const formattedExpectedType = `${returnValueType}${isArray ? '[]' : ''}`;

        // Parse the data, it should be a JSON string.
        let json;
        try {
            json = JSON.parse(data.toString());
        } catch (ignored) {
            const error = new Error(`A return value of type ${formattedExpectedType} was expected for transaction ${transaction.getFullyQualifiedIdentifier()}, but the data returned was not valid JSON`);
            LOG.error(method, error);
            throw error;
        }

        // Process the return value.
        const processPrimitiveReturnDataInner = (item) => {
            if (typeof item !== 'string') {
                const actualReturnValueType = typeof item;
                const error = new Error(`A return value of type ${formattedExpectedType} was expected for transaction ${transaction.getFullyQualifiedIdentifier()}, but a value of type ${actualReturnValueType} was returned`);
                LOG.error(method, error);
                throw error;
            } else if (validEnumValues.indexOf(item) === -1) {
                const error = new Error(`A return value of type ${formattedExpectedType} was expected for transaction ${transaction.getFullyQualifiedIdentifier()}, but an invalid enum value ${item} was returned`);
                LOG.error(method, error);
                throw error;
            }
            return item;
        };

        // Handle the non-array case - a single return value.
        if (!returnsDecorator.isArray()) {
            const result = processPrimitiveReturnDataInner(json);
            LOG.exit(method, result);
            return result;
        }

        // This is the array case - ensure the return value is an array.
        if (!Array.isArray(json)) {
            const actualReturnValueType = typeof actualReturnValue;
            const error = new Error(`A return value of type ${formattedExpectedType} was expected for transaction ${transaction.getFullyQualifiedIdentifier()}, but a value of type ${actualReturnValueType} was returned`);
            LOG.error(method, error);
            throw error;
        }

        // Now handle all the elements of the array.
        const result = json.map(item => processPrimitiveReturnDataInner(item));
        LOG.exit(method, result);
        return result;
    }

    /**
     * Process the primitive return data for the specified transaction.
     * @private
     * @param {Resource} transaction The transaction.
     * @param {Buffer} data The return data.
     * @return {*} The processed return data.
     */
    _processPrimitiveReturnData(transaction, data) {
        const method = '_processPrimitiveReturnData';
        LOG.entry(method, transaction, data);

        // Get the type and resolved type.
        const transactionDeclaration = transaction.getClassDeclaration();
        const returnsDecorator = transactionDeclaration.getDecorator('returns');
        const returnValueType = returnsDecorator.getType();
        const isArray = returnsDecorator.isArray();
        const formattedExpectedType = `${returnValueType}${isArray ? '[]' : ''}`;

        // Parse the data, it should be a JSON value.
        let json;
        try {
            json = JSON.parse(data.toString());
        } catch (ignored) {
            const error = new Error(`A return value of type ${formattedExpectedType} was expected for transaction ${transaction.getFullyQualifiedIdentifier()}, but the data returned was not valid JSON`);
            LOG.error(method, error);
            throw error;
        }

        // Process the return value.
        const processPrimitiveReturnDataInner = (item) => {
            switch (returnsDecorator.getType()) {
            case 'DateTime': {
                if (typeof item !== 'string') {
                    const actualReturnValueType = typeof item;
                    const error = new Error(`A return value of type ${formattedExpectedType} was expected for transaction ${transaction.getFullyQualifiedIdentifier()}, but a value of type ${actualReturnValueType} was returned`);
                    LOG.error(method, error);
                    throw error;
                }
                const millis = new Date(item);
                if (isNaN(millis)) {
                    const actualReturnValueType = typeof item;
                    const error = new Error(`A return value of type ${formattedExpectedType} was expected for transaction ${transaction.getFullyQualifiedIdentifier()}, but a value of type ${actualReturnValueType} was returned`);
                    LOG.error(method, error);
                    throw error;
                }
                return millis;
            }
            case 'Integer':
            case 'Long':
            case 'Double':
                if (typeof item !== 'number') {
                    const actualReturnValueType = typeof item;
                    const error = new Error(`A return value of type ${formattedExpectedType} was expected for transaction ${transaction.getFullyQualifiedIdentifier()}, but a value of type ${actualReturnValueType} was returned`);
                    LOG.error(method, error);
                    throw error;
                }
                return item;
            case 'Boolean':
                if (typeof item !== 'boolean') {
                    const actualReturnValueType = typeof item;
                    const error = new Error(`A return value of type ${formattedExpectedType} was expected for transaction ${transaction.getFullyQualifiedIdentifier()}, but a value of type ${actualReturnValueType} was returned`);
                    LOG.error(method, error);
                    throw error;
                }
                return item;
            default:
                if (item === undefined || item === null || typeof item !== 'string') {
                    const actualReturnValueType = typeof item;
                    const error = new Error(`A return value of type ${formattedExpectedType} was expected for transaction ${transaction.getFullyQualifiedIdentifier()}, but a value of type ${actualReturnValueType} was returned`);
                    LOG.error(method, error);
                    throw error;
                }
                return item;
            }
        };

        // Handle the non-array case - a single return value.
        if (!returnsDecorator.isArray()) {
            const result = processPrimitiveReturnDataInner(json);
            LOG.exit(method, result);
            return result;
        }

        // This is the array case - ensure the return value is an array.
        if (!Array.isArray(json)) {
            const actualReturnValueType = typeof actualReturnValue;
            const error = new Error(`A return value of type ${formattedExpectedType} was expected for transaction ${transaction.getFullyQualifiedIdentifier()}, but a value of type ${actualReturnValueType} was returned`);
            LOG.error(method, error);
            throw error;
        }

        // Now handle all the elements of the array.
        const result = json.map(item => processPrimitiveReturnDataInner(item));
        LOG.exit(method, result);
        return result;
    }

    /**
     * Build a query ready for later execution. The specified query string must
     * be written in the Composer Query Language.
     *
     * This functionality is Blockchain platform dependent. For example, when a
     * Composer business network is deployed to Hyperledger Fabric v1.0,
     * Hyperledger Fabric must be configured with the CouchDB database for the
     * world state.
     * @example
     * const connection = new BusinessNetworkConnection();
     * await connection.connect('admin@network-name');
     * const query = connection.buildQuery('SELECT org.example.SampleAsset WHERE (value == _$inputValue)');
     * const assets = await connection.query(query, { inputValue: 'blue' })
     * @param {string} query The query string, written in the Composer Query
     * Language.
     * @returns {Query} The built query, which can be passed in a call to query.
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
     * Execute a query defined in a Composer query file, or execute a query
     * built with buildQuery.
     *
     * This functionality is Blockchain platform dependent. For example, when a
     * Composer business network is deployed to Hyperledger Fabric v1.0,
     * Hyperledger Fabric must be configured with the CouchDB database for the
     * world state.
     * @example
     * const connection = new BusinessNetworkConnection();
     * await connection.connect('admin@network-name');
     * const assets = await query('Q1', { inputValue: 'blue' })
     * @param {string|Query} query The name of the query, or a built query.
     * @param {Object} [parameters] The parameters for the query.
     * @returns {Promise} A promise that will be resolved with an array of
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
     * const connection = new BusinessNetworkConnection();
     * await connection.connect('admin@network-name');
     * await connection.ping();
     * @returns {Promise} A promise that will be fulfilled when the connection
     * has been tested. The promise will be rejected if the version is
     * incompatible.
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
     * @returns {Promise} A promise that will be fulfilled when the connection
     * has been tested. The promise will be rejected if the version is
     * incompatible.
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
     * Activate the current identity on the currently connected business
     * network.
     * @private
     * @returns {Promise} A promise that will be fulfilled when the connection
     * has been tested. The promise will be rejected if the version is
     * incompatible.
     */
    activate() {
        const method = 'activate';
        LOG.entry(method);
        const json = {
            $class: 'org.hyperledger.composer.system.ActivateCurrentIdentity',
            timestamp: new Date().toISOString()
        };
        return Util.submitTransaction(this.securityContext, json)
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
     * @param {boolean} [options.issuer] Whether or not the new identity should
     * have permissions to create additional new identities. False by default.
     * @returns {Promise} A promise that will be fulfilled when the identity has
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
                    if (this.connection.registryCheckRequired()) {
                        return this.getIdentityRegistry()
                            .then((registry) => {
                                return registry.getAll();
                            })
                            .then((ids) => {
                                ids = ids.map((el) => {
                                    return el.name;
                                });

                                if (ids.includes(identityName)) {
                                    throw new Error(`Identity with name ${identityName} already exists in ${this.getBusinessNetwork().getName()}`);
                                }
                            });
                    }
                } else {
                    throw new Error(`Participant '${participant.getFullyQualifiedIdentifier()}' does not exist `);
                }
            })
            .then(() => {
                return this.connection.createIdentity(this.securityContext, identityName, options);
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
     * @param {Resource|string} participant The participant, or the fully
     * qualified identifier of the participant. The participant must already
     * exist.
     * @param {string} certificate The certificate for the existing identity.
     * @returns {Promise} A promise that will be fulfilled when the identity has
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
     * Revoke the specified identity by removing any existing mapping to a
     * participant.
     * @param {Resource|string} identity The identity, or the identifier of the
     * identity.
     * @returns {Promise} A promise that will be fulfilled when the identity has
     * been removed from the specified participant. The promise will be rejected
     * if the participant does not exist, or if the identity is not mapped to
     * the participant.
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
        // It is not currently possible to revoke the certificate, so we just
        // call the runtime to remove the mapping.
        return this.submitTransaction(transaction)
            .then(() => {
                LOG.exit(method);
            });
    }

    /**
     * Get the native API for this connection. The native API returned is specific
     * to the underlying blockchain platform, and may throw an error if there is no
     * native API available.
     * @return {*} The native API for this connection.
     */
    getNativeAPI() {
        if (!this.connection) {
            throw new Error('not connected; must call connect() first');
        }
        return this.connection.getNativeAPI();
    }

}

module.exports = BusinessNetworkConnection;
