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
 * Main interface to admin operations.
 */
class AdminConnection {

    /**
     * Create an instance of the AdminConnection class.
     * @param {Object} [options] - an optional set of options to configure the instance.
     * @param {Object} [options.fs] - specify an fs implementation to use.
     * @param {boolean} [options.developmentMode] - specify whether or not the instance
     * is in development mode. Use only for testing purposes!
     */
    constructor(options) {
        options = options || {};
        this.connectionProfileStore = new FSConnectionProfileStore(options.fs || fs);
        this.connectionProfileManager = new ConnectionProfileManager(this.connectionProfileStore);
        this.connection = null;
        this.securityContext = null;
    }

    /**
     * Connects and logs in to the Hyperledger Fabric.
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
     * Creates a new connection profile
     * @param {string} connectionProfile - The name of the connection profile
     * @param {Object} data - The connection profile data
     * @return {Promise} A promise that indicates that the connection profile is deployed
     */
    createProfile(connectionProfile, data) {
        return this.connectionProfileManager.getConnectionProfileStore().save(connectionProfile, data);
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
            });
    }

    /**
     * Deploys a BusinessNetworkDefinition to the fabric
     * @param {BusinessNetworkDefinition} businessNetworkDefinition - The business network to deploy
     * @return {Promise} A promise that will be fufilled when the business network has been
     * deployed.
     */
    deploy(businessNetworkDefinition) {
        Util.securityCheck(this.securityContext);
        return this.connection.deploy(this.securityContext, true, businessNetworkDefinition);
    }

    /**
     * Undeploys a BusinessNetworkDefinition from the fabric. The network will no
     * longer be able to process transactions.
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
     * @return {Promise} A promise that will be fufilled when the connection has
     * been tested. The promise will be rejected if the version is incompatible.
     */
    ping() {
        Util.securityCheck(this.securityContext);
        return this.connection.ping(this.securityContext);
    }
}

module.exports = AdminConnection;
