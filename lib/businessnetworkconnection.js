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
const ConnectionProfileManager = require('@ibm/ibm-concerto-common').ConnectionProfileManager;
const EventEmitter = require('events');
const fs = require('fs');
const FSConnectionProfileStore = require('@ibm/ibm-concerto-common').FSConnectionProfileStore;
const ParticipantRegistry = require('./participantregistry');
const TransactionDeclaration = require('@ibm/ibm-concerto-common').TransactionDeclaration;
const TransactionRegistry = require('./transactionregistry');
const Util = require('@ibm/ibm-concerto-common').Util;
const uuid = require('node-uuid');

/**
 * Use this class to connect to and then interact with a deployed BusinessNetworkDefinition.
 * Use the AdminConnection class in the ibm-concerto-admin module to deploy BusinessNetworksDefinitions.
 * @extends EventEmitter
 * @see See [EventEmitter]{@link module:ibm-concerto-client.EventEmitter}
 * @class
 * @memberof module:ibm-concerto-client
 */
class BusinesNetworkConnection extends EventEmitter {

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

        this.connectionProfileStore = new FSConnectionProfileStore(options.fs || fs);
        this.connectionProfileManager = new ConnectionProfileManager(this.connectionProfileStore);

        this.connection = null;
        this.securityContext = null;
        this.businessNetwork = null;
    }


    /**
     * Returns the currently connected BusinessNetworkDefinition
     * @example
     * // Get the Business Network Definition
     * var businessNetwork = new BusinessNetworkConnection();
     * var client;
     * return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
     * .then(function(businessNetworkDefinition){
     *     client = businessNetworkDefinition;
     * })
     * .then(function(){
     *     return client.getBusinessNetwork();
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
     * var client;
     * return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
     * .then(function(businessNetworkDefinition){
     *     client = businessNetworkDefinition;
     * })
     * .then(function(){
     *     return client.getAllAssetRegistries();
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
        return AssetRegistry.getAllAssetRegistries(this.securityContext, this.getBusinessNetwork().getModelManager(), this.getBusinessNetwork().getFactory(), this.getBusinessNetwork().getSerializer());
    }

    /**
     * Get an existing asset registry.
     * @example
     * // Get a asset registry
     * var businessNetwork = new BusinessNetworkConnection();
     * var client;
     * return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
     * .then(function(businessNetworkDefinition){
     *     client = businessNetworkDefinition;
     * })
     * .then(function(){
     *     return client.getAssetRegistry('businessNetworkIdentifier.registryId');
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
        return AssetRegistry.getAssetRegistry(this.securityContext, id, this.getBusinessNetwork().getModelManager(), this.getBusinessNetwork().getFactory(), this.getBusinessNetwork().getSerializer());
    }

    /**
     * Add a new asset registry.
     * @example
     * // Add a new asset registry
     * var businessNetwork = new BusinessNetworkConnection();
     * var client;
     * return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
     * .then(function(businessNetworkDefinition){
     *     client = businessNetworkDefinition;
     * })
     * .then(function(){
     *     return client.addAssetRegistry('registryId','registryName');
     * });
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
     * Get a list of all existing participant registries.
     * @example
     * // Get all participant registries
     * var businessNetwork = new BusinessNetworkConnection();
     * var client;
     * return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
     * .then(function(businessNetworkDefinition){
     *     client = businessNetworkDefinition;
     * })
     * .then(function(){
     *     return client.getAllParticipantRegistries();
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
        return ParticipantRegistry.getAllParticipantRegistries(this.securityContext, this.getBusinessNetwork().getModelManager(), this.getBusinessNetwork().getFactory(), this.getBusinessNetwork().getSerializer());
    }

    /**
     * Get an existing participant registry.
     * @example
     * // Get a participant registry
     * var businessNetwork = new BusinessNetworkConnection();
     * var client;
     * return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
     * .then(function(businessNetworkDefinition){
     *     client = businessNetworkDefinition;
     * })
     * .then(function(){
     *     return client.getParticipantRegistry('businessNetworkIdentifier.registryId');
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
        return ParticipantRegistry.getParticipantRegistry(this.securityContext, id, this.getBusinessNetwork().getModelManager(), this.getBusinessNetwork().getFactory(), this.getBusinessNetwork().getSerializer());
    }

    /**
     * Add a new participant registry.
     * @example
     * // Add a new participant registry
     * var businessNetwork = new BusinessNetworkConnection();
     * var client;
     * return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
     * .then(function(businessNetworkDefinition){
     *     client = businessNetworkDefinition;
     * })
     * .then(function(){
     *     return client.addParticipantRegistry('registryId','registryName');
     * });
     * @param {string} id - The unique identifier of the participant registry
     * @param {string} name - The name of the participant registry
     * @return {Promise} - A promise that will be resolved with the new participant
     * registry after it has been added.
     */
    addParticipantRegistry(id, name) {
        Util.securityCheck(this.securityContext);
        return ParticipantRegistry.addParticipantRegistry(this.securityContext, id, name, this.getBusinessNetwork().getModelManager(), this.getBusinessNetwork().getFactory(), this.getBusinessNetwork().getSerializer());
    }

    /**
     * Get the transaction registry.
     * @example
     * // Get the transaction registry
     * var businessNetwork = new BusinessNetworkConnection();
     * var client;
     * return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
     * .then(function(businessNetworkDefinition){
     *     client = businessNetworkDefinition;
     * })
     * .then(function(){
     *     return client.getTransactionRegistry();
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
     * Connects to a business network using a connection profile, and authenticates to the Hyperledger Fabric.
     * // Connect and log in to HLF
     * var businessNetwork = new BusinessNetworkConnection();
     * var client;
     * return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
     * .then(function(businessNetworkDefinition){
     *     client = businessNetworkDefinition;
     * })
     * .then(function(){
     *     // Connected.
     * });
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
                return this.connection.ping(this.securityContext);
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
                return this.businessNetwork;
            });
    }

    /**
     * Disconnects from the Hyperledger Fabric.
     * @example
     * // Disconnects from HLF
     * var businessNetwork = new BusinessNetworkConnection();
     * var client;
     * return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
     * .then(function(businessNetworkDefinition){
     *     client = businessNetworkDefinition;
     * })
     * .then(function(){
     *     return client.disconnect()
     * })
     * .then(function(){
     *     // Disconnected.
     * });
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
     * Submit a transaction for processing by the currently connected business network.
     * @example
     * // Submits a transaction
     * var businessNetwork = new BusinessNetworkConnection();
     * var client;
     * return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
     * .then(function(businessNetworkDefinition){
     *     client = businessNetworkDefinition;
     * })
     * .then(function(){
     *     var factory = client.getBusinessNetwork().getFactory();
     *     var transaction = factory.newTransaction('network.transactions', 'TransactionType');
     *     return client.submitTransaction(transaction);
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
                return Util.invokeChainCode(self.securityContext, 'submitTransaction', [transactionRegistry.id, JSON.stringify(data)]);
            });
    }

    /**
     * Test the connection to the runtime and verify that the version of the
     * runtime is compatible with this level of the client node.js module.
     * @example
     * // Test the connection to the runtime
     * var businessNetwork = new BusinessNetworkConnection();
     * var client;
     * return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
     * .then(function(businessNetworkDefinition){
     *     client = businessNetworkDefinition;
     * })
     * .then(function(){
     *     return client.ping();
     * })
     * .then(function(){
     *     // Connection tested.
     * });
     * @return {Promise} A promise that will be fufilled when the connection has
     * been tested. The promise will be rejected if the version is incompatible.
     */
    ping() {
        Util.securityCheck(this.securityContext);
        return this.connection.ping(this.securityContext);
    }

}

module.exports = BusinesNetworkConnection;
