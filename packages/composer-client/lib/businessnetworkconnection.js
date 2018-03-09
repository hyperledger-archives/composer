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
const uuid = require('uuid');
const Registry = require('./registry');
const NetworkCardStoreManager = require('composer-common').NetworkCardStoreManager;
const LOG = Logger.getLog('BusinessNetworkConnection');

/**
 * Use this class to connect to and then interact with a deployed
 * {@link module:composer-common.BusinessNetworkDefinition BusinessNetworkDefinition}.
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

        this.cardStore = options.cardStore || NetworkCardStoreManager.getCardStore();
        this.connectionProfileManager = new ConnectionProfileManager();
        this.connection = null;
        this.securityContext = null;
        this.businessNetwork = null;
        this.dynamicQueryFile = null;
        this.card = null;
    }

    /**
     * Gets the currently connected
     * {@link module:composer-common.BusinessNetworkDefinition BusinessNetworkDefinition}.
     * @example
     * // Get the Business Network Definition
     * var connection = new BusinessNetworkConnection();
     * return connection.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
     *     .then(function (definition) {
     *         // Retrieved Business Network Definition
     *         console.log(definition === connection.getBusinessNetwork());  // true
     *     });
     * @returns {BusinessNetworkDefinition} the business network definition
     */
    getBusinessNetwork() {
        return this.businessNetwork;
    }


    /**
     * Gets a list of all existing asset registries.
     * @example
     * // Get all asset registries
     * var connection = new BusinessNetworkConnection();
     * return connection.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
     *     .then(function (definition) {
     *         return connection.getAllAssetRegistries();
     *     })
     *     .then(function (assetRegistries) {
     *         // Retrieved Asset Registries
     *     });
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
     * // Get an asset registry
     * var connection = new BusinessNetworkConnection();
     * return connection.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
     *     .then(function (definition) {
     *         return connection.getAssetRegistry('org.acme.SampleAsset');
     *     })
     *     .then(function (assetRegistry) {
     *         // Retrieved Asset Registry
     *     });
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
     * // Determine whether an asset registry exists
     * var connection = new BusinessNetworkConnection();
     * return connection.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
     *     .then(function (definition) {
     *         return connection.assetRegistryExists('org.acme.SampleAsset');
     *     })
     *     .then(function (exists) {
     *         if (exists === true) {
     *             // logic here...
     *         }
     *     });
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
     * // Add a new asset registry
     * var connection = new BusinessNetworkConnection();
     * return connection.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
     *     .then(function (definition) {
     *         return connection.addAssetRegistry('registryId', 'registryName');
     *     });
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
     * // Get all participant registries
     * var connection = new BusinessNetworkConnection();
     * return connection.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
     *     .then(function (definition) {
     *         return connection.getAllParticipantRegistries();
     *     })
     *     .then(function (participantRegistries) {
     *         // Retrieved Participant Registries
     *     });
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
     * // Get a participant registry
     * var connection = new BusinessNetworkConnection();
     * return connection.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
     *     .then(function (definition) {
     *         return connection.getParticipantRegistry('org.acme.SampleParticipant');
     *     })
     *     .then(function (participantRegistry) {
     *         // Retrieved Participant Registry
     *     });
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
     * // Determine whether an asset registry exists
     * var connection = new BusinessNetworkConnection();
     * return connection.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
     *     .then(function (definition) {
     *         return connection.participantRegistryExists('org.acme.SampleParticipant');
     *     })
     *     .then(function (exists) {
     *         if (exists === true) {
     *             // logic here...
     *         }
     *     });
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
     * // Add a new participant registry
     * var connection = new BusinessNetworkConnection();
     * return connection.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
     *     .then(function (definition) {
     *         return connection.addParticipantRegistry('registryId', 'registryName');
     *     });
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
     * // Get a transaction registry
     * var connection = new BusinessNetworkConnection();
     * return connection.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
     *     .then(function (definition) {
     *         return connection.getTransactionRegistry('org.acme.SampleTransaction');
     *     })
     *     .then(function (transactionRegistry) {
     *         // Retrieved Transaction Registry.
     *     });
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
     * // Get all transaction registries
     * var connection = new BusinessNetworkConnection();
     * return connection.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
     *     .then(function (definition) {
     *         return connection.getAllTransactionRegistries();
     *     })
     *     .then(function (transactionRegistries) {
     *         // Retrieved Transaction Registries
     *     });
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
     * // Determine whether a transaction registry exists
     * var connection = new BusinessNetworkConnection();
     * return connection.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
     *     .then(function (definition) {
     *         return connection.transactionRegistryExists('org.acme.SampleTransaction');
     *     })
     *     .then(function (exists) {
     *         if (exists === true) {
     *             // logic here...
     *         }
     *     });
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
     * // Get the historian
     * var connection = new BusinessNetworkConnection();
     * return connection.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
     *     .then(function (definition) {
     *         return connection.getHistorian();
     *     })
     *     .then(function (historian) {
     *         // Retrieved historian
     *     });
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
     * // Get the identity registry
     * var connection = new BusinessNetworkConnection();
     * return connection.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
     *     .then(function (definition) {
     *         return connection.getIdentityRegistry();
     *     })
     *     .then(function (identityRegistry) {
     *         // Retrieved identity registry
     *     });
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
     * // Connect and log in to HLF
     * var connection = new BusinessNetworkConnection();
     * return connection.connect('admin@acme-network')
     *     .then(function (definition) {
     *         // Connected
     *     });
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
     * // Locate the registry for a fully qualififed name
     * var connection = new BusinessNetworkConnection();
     * return connection.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
     *     .then(function (definition) {
     *         return connection.getRegistry('org.acme.SampleAsset');
     *     })
     *     .then(function (sampleAssetRegistry) {
     *         return connection.getRegistry('org.acme.SampleParticipant');
     *     })
     *     .then(function (sampleParticipantRegistry) {
     *         return connection.getRegistry('org.acme.SampleTransaction');
     *     })
     *     .then(function (sampleTransactionRegistry) {
     *         // ...
     *     });
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
     * // Disconnect from HLF
     * var connection = new BusinessNetworkConnection();
     * return connection.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
     *     .then(function (definition) {
     *         return connection.disconnect();
     *     })
     *     .then(function () {
     *         // Disconnected.
     *     });
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
     * // Submits a transaction
     * var connection = new BusinessNetworkConnection();
     * return connection.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
     *     .then(function (definition) {
     *         var factory = definition.getFactory();
     *         var transaction = factory.newTransaction('org.acme', 'SampleTransaction');
     *         return connection.submitTransaction(transaction);
     *     })
     *     .then(function () {
     *         // Submitted a transaction.
     *     });
     * @param {Resource} transaction - The transaction to submit. Use
     * {@link module:composer-common.Factory#newTransaction newTransaction} to
     * create this object.
     * @returns {Promise} A promise that will be fulfilled when the transaction
     * has been processed.
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

        return Util.createTransactionId(this.securityContext)
            .then((id) => {
                transaction.setIdentifier(id.idStr);
                transaction.timestamp = new Date();
                let data = this.getBusinessNetwork().getSerializer().toJSON(transaction);
                return Util.invokeChainCode(this.securityContext, 'submitTransaction', [JSON.stringify(data)], { transactionId: id.id });
            });

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
     * // Build and execute a query.
     * var connection = new BusinessNetworkConnection();
     * return connection.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
     *     .then(function () {
     *         var query = connection.buildQuery('SELECT org.acme.SampleAsset WHERE (value == _$inputValue)');
     *         return connection.query(query, { inputValue: 'blue' })
     *     })
     *     .then(function (assets) {
     *         // Retrieved Assets
     *     });
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
     * // Execute the query.
     * var connection = new BusinessNetworkConnection();
     * return connection.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
     *     .then(function () {
     *         return query('Q1', { inputValue: 'blue' })
     *     })
     *     .then(function (assets) {
     *         // Retrieved Assets
     *     });
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
     * // Test the connection to the runtime
     * var connection = new BusinessNetworkConnection();
     * return connection.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
     *     .then(function (definition) {
     *         return connection.ping();
     *     })
     *     .then(function () {
     *         // Connection tested.
     *     });
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
            transactionId: uuid.v4(),
            timestamp: new Date().toISOString()
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

}

module.exports = BusinessNetworkConnection;
