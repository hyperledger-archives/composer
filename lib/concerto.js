/*
 * IBM Confidential
 * OCO Source Materials
 * IBM Concerto - Blockchain Solution Framework
 * Copyright IBM Corp. 2016
 * The source code for this program is not published or otherwise
 * divested of its trade secrets, irrespective of what has
 * been deposited with the U.S. Copyright Office.
 */

'use strict';

const AssetRegistry = require('./assetregistry');
const EventEmitter = require('events');
const Factory = require('@ibm/ibm-concerto-common').Factory;
const Globalize = require('@ibm/ibm-concerto-common').Globalize;
const ModelManager = require('@ibm/ibm-concerto-common').ModelManager;
const ModelRegistry = require('./modelregistry');
const Serializer = require('@ibm/ibm-concerto-common').Serializer;
const TransactionDeclaration = require('@ibm/ibm-concerto-common').TransactionDeclaration;
const TransactionRegistry = require('./transactionregistry');
const Util = require('@ibm/ibm-concerto-common').Util;
const uuid = require('node-uuid');

/**
 * Main entry point into the Concerto solution framework. Use this class
 * to retrieve the services defined by the solution framework and to interact
 * with the underlying Hyperledger fabric. This class is designed to be used in a
 * Node.js based middle-tier of a 3-tier application:
 * <ol>
 *   <li>Presentation tier, e.g. Angular front-end</li>
 *   <li>Middle tier, exposes domain specific REST APIs to the presentation tier
 *       and embeds the Concerto module to communicate with Hyperledger fabric.</li>
 *   <li>Hyperledger fabric, used to store assets and transaction on a blockchain</li>
 * </ol>
 * <p>
 * The Concerto class provides access to the major subsystems defined by the framework:
 * <ul>
 *   <li>{@link ModelManager} to declare the structure of Resources for an application domain
 *   <li>{@link Factory} to create instances of Resources (Assets, Transactions or Participants)
 *   <li>{@link Serializer} to convert Resources to/from JavaScript Objects for long-term persistence
 *   <li>{@link AssetRegistry} to store Assets on the blockchain
 *   <li>{@link TransactionRegistry} to store Transactions on the blockchain
 *   <li>{@link Concerto#submitTransaction submitTransaction} to submit Transaction for processing to the Hyperledger fabric.
 * </ul>
 * </p>
 * <p>
 * The {@link Concerto#connect connect} method is used to connect to a Hyperledger
 * fabric instance.
 * </p>
 * <p>
 * The {@link Concerto#login login} method is used to authenticate a user/application
 * with the Hyperledger fabric and returns a {@link SecurityContext} that must be
 * passed to other Concerto APIs that require authentication.
 * </p>
 * <h4>Bootstrapping the Concerto Framework</h4>
 * <p>
 * The {@link Concerto#deploy deploy} method is used to deploy the Concerto Framework chaincode
 * to your Hyperledger instance. This only needs to be called once for all Concerto
 * based application that use a Hyperledger fabric instance.
 * </p>
 * <h4>Bootstrapping your Application</h4>
 * Bootrapping a Concerto-based application requires:
 * <ol>
 *   <li>Connecting to the Hyperledger Fabric using the {@link Concerto.connect connect} method
 *   <li>Login to the Hyperledger Fabric using the {@link Concerto.login login} method
 *   <li>Load the application's domain specific Concerto files and add to the {@link ModelManager}
 *   <li>Use the {@link Concerto#saveModels saveModels} method to store the contents of the {@link ModelManager}
 *       on the blockchain.
 * </ol>
 * Application bootstrap only needs to be performed once for a given Hyperledger fabric instance,
 * or when the Concerto files have been modified.
 */
class Concerto extends EventEmitter {

    /**
     * Create an instance of the Concerto class.
     * @param {Object} [options] - an optional set of options to configure the instance.
     * @param {Object} [options.connectionManager] - specify a connection manager to use.
     * @param {boolean} [options.developmentMode] - specify whether or not the instance
     * is in development mode. Use only for testing purposes!
     */
    constructor(options) {
        super();
        options = options || {};
        this.modelManager = new ModelManager();
        this.factory = new Factory(this.modelManager);
        this.serializer = new Serializer(this.factory, this.modelManager);
        this.developmentMode = options.developmentMode || false;
        this.connectionManager = options.connectionManager || null;
        this.connection = null;
        if (!this.connectionManager) {
            // This weird code is needed to trick browserify.
            let req = require;
            let mod = '@ibm/ibm-concerto-connector-hlf';
            this.connectionManager = new(req(mod));
        }
        this.modelRegistry = new ModelRegistry(this.modelManager);
    }

    /**
     * Get a list of all existing asset registries.
     * @param {SecurityContext} securityContext - The user's security context
     * @return {Promise} - A promise that will be resolved with a list of existing
     * asset registries
     */
    getAllAssetRegistries(securityContext) {
        Util.securityCheck(securityContext);
        return AssetRegistry.getAllAssetRegistries(securityContext, this.modelManager, this.factory, this.serializer);
    }

    /**
     * Get an existing asset registry.
     * @param {SecurityContext} securityContext - The user's security context
     * @param {string} id - The unique identifier of the asset registry
     * @return {Promise} - A promise that will be resolved with the existing asset
     * registry, or rejected if the asset registry does not exist.
     */
    getAssetRegistry(securityContext, id) {
        Util.securityCheck(securityContext);
        return AssetRegistry.getAssetRegistry(securityContext, id, this.modelManager, this.factory, this.serializer);
    }

    /**
     * Add a new asset registry.
     * @param {SecurityContext} securityContext - The user's security context
     * @param {string} id - The unique identifier of the asset registry
     * @param {string} name - The name of the asset registry
     * @return {Promise} - A promise that will be resolved with the new asset
     * registry after it has been added.
     */
    addAssetRegistry(securityContext, id, name) {
        Util.securityCheck(securityContext);
        return AssetRegistry.addAssetRegistry(securityContext, id, name, this.modelManager, this.factory, this.serializer);
    }

    /**
     * Get the model registry.
     * @param {SecurityContext} securityContext - The user's security context
     * @return {Promise} - A promise that will be resolved with the model registry.
     * @private
     */
    getModelRegistry(securityContext) {
        Util.securityCheck(securityContext);
        return Promise.resolve(this.modelRegistry);
    }

    /**
     * Get the transaction registry.
     * @param {SecurityContext} securityContext - The user's security context
     * @return {Promise} - A promise that will be resolved to the {@link TransactionRegistry}
     */
    getTransactionRegistry(securityContext) {
        Util.securityCheck(securityContext);
        return TransactionRegistry
            .getAllTransactionRegistries(securityContext, this.modelManager, this.factory, this.serializer)
            .then(function (transactionRegistries) {
                if (transactionRegistries.length >= 1) {
                    return transactionRegistries[0];
                } else {
                    throw new Error('Failed to find the default transaction registry');
                }
            });
    }

    /**
     * Returns the Factory, used to create instances of Resources, Relationships
     * and Transactions.
     *
     * @param {SecurityContext} securityContext - The user's security context
     * @return {Factory} the Factory
     */
    getFactory(securityContext) {
        Util.securityCheck(securityContext);
        return this.factory;
    }

    /**
     * Returns the ModelManager, used to define the entities in an application domain.
     * @param {SecurityContext} securityContext - The user's security context
     * @return {ModelManager} the ModelManager
     */
    getModelManager(securityContext) {
        Util.securityCheck(securityContext);
        return this.modelManager;
    }

    /**
     * Returns the Serializer
     * @param {SecurityContext} securityContext - The user's security context
     * @return {Serializer} the Serializer
     */
    getSerializer(securityContext) {
        Util.securityCheck(securityContext);
        return this.serializer;
    }

    /**
     * Connects to the Hyperledger Fabric.
     * @param {Object} connectOptions - The connection options.
     * @return {Promise} A promise that will be resolved when the connection is
     * established.
     */
    connect(connectOptions) {
        if (!connectOptions) {
            throw new Error(Globalize.formatMessage('concerto-connect-noconopts'));
        }
        return this.connectionManager.connect(connectOptions)
            .then((connection) => {
                this.connection = connection;
            });
    }

    /**
     * Disconnects from the Hyperledger Fabric.
     * @return {Promise} A promise that will be resolved when the connection is
     * terminated.
     */
    disconnect() {
        if (!this.connection) {
            return Promise.resolve();
        }
        return this.connection.disconnect()
            .then(() => {
                this.connection = null;
            });
    }

    /**
     * Log in to the Hyperledger Fabric as the specified user
     *
     * @param {string} enrollmentID the enrollment ID of the user
     * @param {string} enrollmentSecret the enrollment secret of the user
     * @return {Promise} A promise that will be resolved with a {SecurityContext}
     * when the the security context
     */
    login(enrollmentID, enrollmentSecret) {
        if (!enrollmentID) {
            throw new Error(Globalize.formatMessage('concerto-login-noenrollmentid'));
        } else if (!enrollmentSecret) {
            throw new Error(Globalize.formatMessage('concerto-login-noenrollmentsecret'));
        }
        return this.connection.login(enrollmentID, enrollmentSecret);
    }

    /**
     * Deploys the Concerto chain-code to the Hyperledger Fabric.
     * @param {SecurityContext} securityContext - The user's security context
     * @param {boolean} [force] - Force a new instance of the chain-code to deploy.
     * @return {Promise} A promise that will be fufilled when the chain-code has
     * been deployed.
     */
    deploy(securityContext, force) {
        Util.securityCheck(securityContext);
        return this.connection.deploy(securityContext, force);
    }

    /**
     * Load the models previously saved using {@link Concerto#saveModels saveModels}
     * from the blockchain back into the {@link ModelManager}. Note that any
     * existing models in the ModelManager will be cleared.
     * @param {SecurityContext} securityContext - The user's security context
     * @return {Promise} A promise that will be fufilled when the models have been
     * loaded into the {@link ModelManager}
     */
    loadModels(securityContext) {
        let self = this;
        Util.securityCheck(securityContext);
        return this
            .getModelRegistry(securityContext)
            .then((modelRegistry) => {
                return modelRegistry.getAll(securityContext);
            })
            .then((models) => {
                self.modelManager.clearModelFiles();
                self.modelManager.addModelFiles(models);
            });
    }

    /**
     * Save all of the models in the {@link ModelManager} to the blockchain.
     * @param {SecurityContext} securityContext - The user's security context
     * @return {Promise} A promise that will be fufilled when the models have been
     * saved to the blockchain.
     */
    saveModels(securityContext) {
        let self = this;
        Util.securityCheck(securityContext);
        return this
            .getModelRegistry(securityContext)
            .then((modelRegistry) => {
                let promises = [];
                self.modelManager.getModelFiles().forEach((modelFile) => {
                    promises.push(modelRegistry.add(securityContext, modelFile));
                });
                return Promise.all(promises);
            });
    }

    /**
     * Submit a transaction for processing to the Hyperledger fabric.
     * @param {SecurityContext} securityContext - The user's security context
     * @param {Resource} transaction - The transaction to submit. Use {@link
     * Factory#newTransaction newTransaction} to create this object.
     * @return {Promise} A promise that will be fufilled when the transaction has
     * been processed.
     */
    submitTransaction(securityContext, transaction) {
        Util.securityCheck(securityContext);
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
        let data = this.serializer.toJSON(transaction);
        return this.getTransactionRegistry(securityContext)
            .then(function (transactionRegistry) {
                return Util.invokeChainCode(securityContext, 'submitTransaction', [transactionRegistry.id, id, JSON.stringify(data)]);
            });
    }

    /**
     * Test the connection to the chain-code and verify that the version of the
     * running chain-code is compatible with this level of the node.js module.
     * @param {SecurityContext} securityContext - The user's security context
     * @return {Promise} A promise that will be fufilled when the connection has
     * been tested. The promise will be rejected if the version is incompatible.
     */
    ping(securityContext) {
        Util.securityCheck(securityContext);
        return this.connection.ping(securityContext);
    }


}

module.exports = Concerto;
