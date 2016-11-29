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

const ConnectionManager = require('./connectionmanager');

/**
 * Base class representing a connection to a business network.
 * @private
 * @abstract
 */
class Connection {

    /**
     * Constructor.
     * @param {ConnectionManager} connectionManager The owning connection manager.
     * @param {string} connectionProfile The name of the connection profile associated with this connection
     * @param {string} businessNetworkIdentifier The identifier of the business network for this connection, or null if an admin connection
     */
    constructor(connectionManager, connectionProfile, businessNetworkIdentifier) {
        if (!(connectionManager instanceof ConnectionManager)) {
            throw new Error('connectionManager not specified');
        } else if (!connectionProfile) {
            throw new Error('connectionProfile not specified');
        }
        this.connectionManager = connectionManager;
        this.connectionProfile = connectionProfile;
        this.businessNetworkIdentifier = businessNetworkIdentifier;
    }

    /**
     * Get the connection manager that owns this connection.
     * @return {ConnectionManager} The owning connection manager.
     */
    getConnectionManager() {
        return this.connectionManager;
    }

    /**
     * Returns a string that can be used to identify this connection.
     * @return {string} the identifier of this connection
     */
    getIdentifier() {
        if(this.businessNetworkIdentifier) {
            return this.businessNetworkIdentifier + '@' + this.connectionProfile;
        }
        else {
            return this.connectionProfile;
        }
    }

    /**
     * Terminate the connection to the business network.
     * @abstract
     * @return {Promise} A promise that is resolved once the connection has been
     * terminated, or rejected with an error.
     */
    disconnect() {
        return Promise.reject(new Error('abstract function called'));
    }

    /**
     * Login as a participant on the business network.
     * @abstract
     * @param {string} enrollmentID The enrollment ID of the participant.
     * @param {string} enrollmentSecret The enrollment secret of the participant.
     * @return {Promise} A promise that is resolved with a {@link SecurityContext}
     * object representing the logged in participant, or rejected with a login error.
     */
    login(enrollmentID, enrollmentSecret) {
        return Promise.reject(new Error('abstract function called'));
    }

    /**
     * Deploy a business network definition.
     * @abstract
     * @param {SecurityContext} securityContext The participant's security context.
     * @param {boolean} [force] Force the deployment of the business network artifacts.
     * @param {BusinessNetworkDefinition} businessNetworkDefinition The BusinessNetworkDefinition to deploy
     * @return {Promise} A promise that is resolved once the business network
     * artifacts have been deployed, or rejected with an error.
     */
    deploy(securityContext, force, businessNetworkDefinition) {
        return Promise.reject(new Error('abstract function called'));
    }

    /**
     * Updates an existing deployed business network definition.
     * @abstract
     * @param {SecurityContext} securityContext The participant's security context.
     * @param {BusinessNetworkDefinition} businessNetworkDefinition The BusinessNetworkDefinition to deploy
     * @return {Promise} A promise that is resolved once the business network
     * artifacts have been updated, or rejected with an error.
     */
    update(securityContext, businessNetworkDefinition) {
        return Promise.reject(new Error('abstract function called'));
    }

    /**
     * Undeploy a business network definition.
     * @abstract
     * @param {SecurityContext} securityContext The participant's security context.
     * @param {string} businessNetworkIdentifier The identifier of the business network to remove
     * @return {Promise} A promise that is resolved once the business network
     * artifacts have been undeployed, or rejected with an error.
     */
    undeploy(securityContext, businessNetworkIdentifier) {
        return Promise.reject(new Error('abstract function called'));
    }

    /**
     * Test ("ping") the connection to the business network.
     * @abstract
     * @param {SecurityContext} securityContext The participant's security context.
     * @return {Promise} A promise that is resolved once the connection to the
     * business network has been tested, or rejected with an error.
     */
    ping(securityContext) {
        return Promise.reject(new Error('abstract function called'));
    }

    /**
     * Invoke a "query" chaincode function with the specified name and arguments.
     * @abstract
     * @param {SecurityContext} securityContext The participant's security context.
     * @param {string} functionName The name of the chaincode function to invoke.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @return {Promise} A promise that is resolved with the data returned by the
     * chaincode function once it has been invoked, or rejected with an error.
     */
    queryChainCode(securityContext, functionName, args) {
        return Promise.reject(new Error('abstract function called'));
    }

    /**
     * Invoke a "invoke" chaincode function with the specified name and arguments.
     * @abstract
     * @param {SecurityContext} securityContext The participant's security context.
     * @param {string} functionName The name of the chaincode function to invoke.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @return {Promise} A promise that is resolved once the chaincode function
     * has been invoked, or rejected with an error.
     */
    invokeChainCode(securityContext, functionName, args) {
        return Promise.reject(new Error('abstract function called'));
    }

    /**
     * Stop serialization of this object.
     * @return {Object} An empty object.
     */
    toJSON() {
        return {};
    }

}

module.exports = Connection;
