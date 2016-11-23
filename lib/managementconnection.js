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

const Admin = require('./admin');
const BusinessNetworkRegistry = require('./businessnetworkregistry');
const Util = require('@ibm/ibm-concerto-common').Util;

/**
 */
class ManagementConnection {

    /**
     * Create an instance of the Concerto class.
     * @param {Object} [options] - an optional set of options to configure the instance.
     * @param {Object} [options.connectionManager] - specify a connection manager to use.
     * @param {boolean} [options.developmentMode] - specify whether or not the instance
     * is in development mode. Use only for testing purposes!
     */
    constructor() {
        this.admin = new Admin({});
        this.securityContext = null;
    }

    /**
     * Connects to the Hyperledger Fabric.
     * @param {Object} connectOptions - The connection options.
     * @param {string} enrollmentID the enrollment ID of the user
     * @param {string} enrollmentSecret the enrollment secret of the user
     * @return {Promise} A promise to the BusinessNetworkRegistry that will be
     * resolved when the connection is established.
     */
    connect(connectOptions, enrollmentID, enrollmentSecret) {
        const self = this;
        return this.admin.connect(connectOptions, enrollmentID, enrollmentSecret)
        .then(() => {
            return new BusinessNetworkRegistry(self);
        });
    }

    /**
     * Disconnects from the Hyperledger Fabric.
     * @return {Promise} A promise that will be resolved when the connection is
     * terminated.
     */
    disconnect() {
        return this.admin.disconnect();
    }

    /**
     * Deploys the Concerto chain-code to the Hyperledger Fabric.
     * @param {boolean} [force] - Force a new instance of the chain-code to deploy.
     * @return {Promise} A promise that will be fufilled when the chain-code has
     * been deployed.
     */
    deploy(force) {
        Util.securityCheck(this.securityContext);
        return this.connection.deploy(this.securityContext, force);
    }

    /**
     * Test the connection to the chain-code and verify that the version of the
     * running chain-code is compatible with this level of the node.js module.
     * @return {Promise} A promise that will be fufilled when the connection has
     * been tested. The promise will be rejected if the version is incompatible.
     */
    ping() {
        Util.securityCheck(this.securityContext);
        return this.connection.ping(this.securityContext);
    }
}

module.exports = ManagementConnection;
