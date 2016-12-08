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

const Util = require('@ibm/ibm-concerto-common').Util;
const ConnectionProfileManager = require('@ibm/ibm-concerto-common').ConnectionProfileManager;
const FSConnectionProfileStore = require('@ibm/ibm-concerto-common').FSConnectionProfileStore;

const fs = require('fs');

/**
 * This class creates an administration connection to a Concerto runtime. The
 * connection can then be used to:
 * <ul>
 * <li>Deploy BusinessNetworkDefinitions</li>
 * <li>Undeploy BusinessNetworkDefinitions</li>
 * <li>Update BusinessNetworkDefinitions</li>
 * <li>Send a ping message to the runtime to ensure it is running and
 * correctly configured.</li>
 * <li>Store a connection profile document in the connection profile store</li>
 * </ul>
 *
 * @class
 * @memberof module:ibm-concerto-admin
 */
class AdminConnection {

    /**
     * Create an instance of the AdminConnection class.
     * @param {Object} [options] - an optional set of options to configure the instance.
     * @param {Object} [options.fs] - specify an fs implementation to use.
     */
    constructor(options) {
        options = options || {};
        this.connectionProfileStore = new FSConnectionProfileStore(options.fs || fs);
        this.connectionProfileManager = new ConnectionProfileManager(this.connectionProfileStore);
        this.connection = null;
        this.securityContext = null;
    }

    /**
     * Connects and logs in to the Hyperledger Fabric using a named connection
     * profile. The connection profile must exist in the profile store.
     * @example
     * // Connect to Hyperledger Fabric
     * var adminConnection = new AdminConnection();
     * adminConnection.connect('testprofile', 'WebAppAdmin', 'DJY27pEnl16d')
     * .then(function(){
     *     // Connected.
     * })
     * .catch(function(error){
     *     // Add optional error handling here.
     * });
     * @param {string} connectionProfile - The name of the connection profile
     * @param {string} enrollmentID the enrollment ID of the user
     * @param {string} enrollmentSecret the enrollment secret of the user
     * @return {Promise} A promise that indicates the connection is complete
     */
    connect(connectionProfile, enrollmentID, enrollmentSecret) {
        return this.connectionProfileManager.connect(connectionProfile, null)
            .then((connection) => {
                this.connection = connection;
                return connection.login(enrollmentID, enrollmentSecret);
            })
            .then((securityContext) => {
                this.securityContext = securityContext;
                return Promise.resolve('connected');
            });
    }

    /**
     * Stores a connection profile into the profile store being used by this
     * AdminConnection.
     * @example
     * // Create a connection profile
     * var adminConnection = new AdminConnection();
     * var adminOptions = {
     *     type: 'hlf',
     *     keyValStore: '/tmp/keyValStore',
     *     membershipServicesURL: 'grpc://membersrvc:7054',
     *     peerURL: 'grpc://vp0:7051',
     *     eventHubURL: 'grpc://vp0:7053'
     * };
     * return adminConnection.createProfile('testprofile', adminOptions)
     * .then(function(){
     *     // Created profile
     * })
     * .catch(function(error){
     *     // Add optional error handling here.
     * });
     * @param {string} connectionProfile - The name of the connection profile
     * @param {Object} data - The connection profile data
     * @return {Promise} A promise that indicates that the connection profile is deployed
     */
    createProfile(connectionProfile, data) {
        return this.connectionProfileManager.getConnectionProfileStore().save(connectionProfile, data);
    }

    /**
     * Disconnects this connection.
     * @example
     * // Disconnect from a Business Network
     * var adminConnection = new AdminConnection();
     * return adminConnection.disconnect()
     * .then(function(){
     *     // Disconnected.
     * })
     * .catch(function(error){
     *     // Add optional error handling here.
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
            });
    }

    /**
     * Deploys a new BusinessNetworkDefinition to the fabric. The connection must
     * be connected for this method to succeed.
     * @example
     * // Deploy a Business Network Definition
     * var adminConnection = new AdminConnection();
     * var businessNetworkDefinition = new BusinessNetworkDefinition('identifier', 'description');
     * return adminConnection.deploy(businessNetworkDefinition)
     * .then(function(){
     *     // Business network definition deployed
     * })
     * .catch(function(error){
     *     // Add optional error handling here.
     * });
     * @param {BusinessNetworkDefinition} businessNetworkDefinition - The business network to deploy
     * @return {Promise} A promise that will be fufilled when the business network has been
     * deployed.
     */
    deploy(businessNetworkDefinition) {
        Util.securityCheck(this.securityContext);
        return this.connection.deploy(this.securityContext, true, businessNetworkDefinition);
    }

    /**
     * Undeploys a BusinessNetworkDefinition from the fabric. The business network will no
     * longer be able to process transactions.
     * @example
     * // Undeploy a Business Network Definition
     * var adminConnection = new AdminConnection();
     * return adminConnection.undeploy('identifier')
     * .then(function(){
     *     // Undeployed Business Network Definition
     * })
     * .catch(function(error){
     *     // Add optional error handling here.
     * })
     * @param {string} businessNetworkIdentifier - The identifier of the network to undeploy
     * @return {Promise} A promise that will be fufilled when the business network has been
     * undeployed.
     */
    undeploy(businessNetworkIdentifier) {
        Util.securityCheck(this.securityContext);
        return this.connection.undeploy(this.securityContext, businessNetworkIdentifier);
    }

    /**
     * Updates an existing BusinessNetworkDefinition on the fabric. The BusinessNetworkDefinition
     * must have been previously deployed.
     * @example
     * // Updates a Business Network Definition
     * var adminConnection = new AdminConnection();
     * var businessNetworkDefinition = new BusinessNetworkDefinition('identifier', 'description');
     * return adminConnection.update(businessNetworkDefinition)
     * .then(function(){
     *     // Business network definition updated
     * })
     * .catch(function(error){
     *     // Add optional error handling here.
     * });
     * @param {BusinessNetworkDefinition} businessNetworkDefinition - The new BusinessNetworkDefinition
     * @return {Promise} A promise that will be fufilled when the business network has been
     * updated.
     */
    update(businessNetworkDefinition) {
        Util.securityCheck(this.securityContext);
        return this.connection.update(this.securityContext, businessNetworkDefinition);
    }

    /**
     * Test the connection to the runtime and verify that the version of the
     * runtime is compatible with this level of the node.js module.
     * @example
     * // Test the connection to the runtime
     * var adminConnection = new AdminConnection();
     * return adminConnection.ping()
     * .then(function(){
     *     // Connection has been tested
     * })
     * .catch(function(error){
     *     // Add optional error handling here.
     * });
     * @return {Promise} A promise that will be fufilled when the connection has
     * been tested. The promise will be rejected if the version is incompatible.
     */
    ping() {
        Util.securityCheck(this.securityContext);
        return this.connection.ping(this.securityContext);
    }

}

module.exports = AdminConnection;
