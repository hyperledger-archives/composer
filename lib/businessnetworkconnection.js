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
const BusinessNetworkDefinition = require('@ibm/ibm-concerto-common').BusinessNetworkDefinition;
const EventEmitter = require('events');
const TransactionDeclaration = require('@ibm/ibm-concerto-common').TransactionDeclaration;
const TransactionRegistry = require('./transactionregistry');
const Util = require('@ibm/ibm-concerto-common').Util;
const uuid = require('node-uuid');

const ConnectionProfileManager = require('@ibm/ibm-concerto-common').ConnectionProfileManager;
const FSConnectionProfileStore = require('@ibm/ibm-concerto-common').FSConnectionProfileStore;
const fs = require('fs');

/**
 * Use this class to connect to and then interact with a deployed BusinessNetworkDefinition.
 * Use the Admin class to deploy BusinessNetworks.
 * @extends EventEmitter
 * @see See [EventEmitter]{@link module:ibm-concerto-client.EventEmitter}
 * @class
 * @memberof module:ibm-concerto-client
 */
class Concerto extends EventEmitter {

    /**
     * Create an instance of the Concerto class.
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

        this.connectionProfileStore = new FSConnectionProfileStore(options.fs || fs);
        this.connectionProfileManager = new ConnectionProfileManager(this.connectionProfileStore);

        this.connection = null;
        this.securityContext = null;
        this.businessNetwork = null;
    }


    /**
     * Returns the currently connected BusinessNetworkDefinition
     * @returns {BusinessNetworkDefinition} the business network
     */
    getBusinessNetwork() {
        return this.businessNetwork;
    }

    /**
     * Get a list of all existing asset registries.
     * @param {SecurityContext} securityContext - The user's security context
     * @return {Promise} - A promise that will be resolved with a list of existing
     * asset registries
     */
    getAllAssetRegistries() {
        Util.securityCheck(this.securityContext);
        return AssetRegistry.getAllAssetRegistries(this.securityContext, this.getBusinessNetwork().getModelManager(), this.getBusinessNetwork().getFactory(), this.getBusinessNetwork().getSerializer());
    }

    /**
     * Get an existing asset registry.
     * @param {string} id - The unique identifier of the asset registry
     * @return {Promise} - A promise that will be resolved with the existing asset
     * registry, or rejected if the asset registry does not exist.
     */
    getAssetRegistry(id) {
        Util.securityCheck(this.securityContext);
        return AssetRegistry.getAssetRegistry(this.securityContext, id, this.getBusinessNetwork().getModelManager(), this.getBusinessNetwork().getFactory(), this.getBusinessNetwork().getSerializer());
    }

    /**
     * Add a new asset registry.
     * @param {string} id - The unique identifier of the asset registry
     * @param {string} name - The name of the asset registry
     * @return {Promise} - A promise that will be resolved with the new asset
     * registry after it has been added.
     */
    addAssetRegistry(id, name) {
        Util.securityCheck(this.securityContext);
        return AssetRegistry.addAssetRegistry(this.securityContext, id, name, this.getBusinessNetwork().getModelManager(), this.getBusinessNetwork().getFactory(), this.getBusinessNetwork().getSerializer());
    }

    /**
     * Get the transaction registry.
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
     * Connects and logs in to the Hyperledger Fabric.
     * @param {string} connectionProfile - The name of the connection profile
     * @param {string} businessNetwork - The identifier of the business network
     * @param {string} enrollmentID the enrollment ID of the user
     * @param {string} enrollmentSecret the enrollment secret of the user
     * @return {Promise} A promise to a BusinessNetworkDefinition that indicates the connection is complete
     */
    connect(connectionProfile, businessNetwork, enrollmentID, enrollmentSecret) {
        return this.connectionProfileManager.connect(connectionProfile, businessNetwork)
            .then((connection) => {
                this.connection = connection;
                return connection.login(enrollmentID, enrollmentSecret);
            })
            .then((securityContext) => {
                this.securityContext = securityContext;
                return Util.queryChainCode(securityContext, 'getBusinessNetwork', []);
            })
            .then((buffer) => {
                let businessNetworkJSON = JSON.parse(buffer.toString());
                let businessNetworkArchive = Buffer.from(businessNetworkJSON.data, 'base64');
                return BusinessNetworkDefinition.fromArchive(businessNetworkArchive);
            })
            .then((businessNetwork) => {
                console.log(businessNetwork);
                this.businessNetwork = businessNetwork;
                return this.businessNetwork;
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
                this.securityContext = null;
                this.businessNetwork = null;
            });
    }

    /**
     * Submit a transaction for processing to the Hyperledger fabric.
     * @param {Resource} transaction - The transaction to submit. Use {@link
     * Factory#newTransaction newTransaction} to create this object.
     * @return {Promise} A promise that will be fufilled when the transaction has
     * been processed.
     */
    submitTransaction(transaction) {
        const self = this;
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
        let data = self.getBusinessNetwork().getSerializer().toJSON(transaction);
        return self.getTransactionRegistry(self.securityContext)
            .then((transactionRegistry) => {
                return Util.invokeChainCode(self.securityContext, 'submitTransaction', [transactionRegistry.id, id, JSON.stringify(data)]);
            });
    }

    /**
     * Test the connection to the runtime and verify that the version of the
     * runtime is compatible with this level of the node.js module.
     * @return {Promise} A promise that will be fufilled when the connection has
     * been tested. The promise will be rejected if the version is incompatible.
     */
    ping() {
        Util.securityCheck(this.securityContext);
        return this.connection.ping(this.securityContext);
    }
}

module.exports = Concerto;
