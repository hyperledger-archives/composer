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

const BusinessNetworkDefinition = require('./businessnetworkdefinition.js');
const ConnectionManager = require('./connectionmanager');
const EventEmitter = require('events');
const Util = require('./util');

/**
 * Base class representing a connection to a business network.
 * @private
 * @abstract
 * @class
 * @memberof module:composer-common
 */
class Connection extends EventEmitter {

    /**
     * Constructor.
     * @param {ConnectionManager} connectionManager The owning connection manager.
     * @param {string} connectionProfile The name of the connection profile associated with this connection
     * @param {string} businessNetworkIdentifier The identifier of the business network for this connection, or null if an admin connection
     */
    constructor(connectionManager, connectionProfile, businessNetworkIdentifier) {
        super();
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
     * Get the native API for this connection. The native API returned is specific
     * to the underlying blockchain platform, and may throw an error if there is no
     * native API available.
     * @abstract
     * @return {*} The native API for this connection.
     */
    getNativeAPI() {
        throw new Error('abstract function called');
    }

    /**
     * Terminate the connection to the business network.
     * @abstract
     * @return {Promise} A promise that is resolved once the connection has been
     * terminated, or rejected with an error.
     */
    async disconnect() {
        throw new Error('abstract function called');
    }

    /**
     * Login as a participant on the business network.
     * @abstract
     * @param {string} enrollmentID The enrollment ID of the participant.
     * @param {string} enrollmentSecret The enrollment secret of the participant.
     * @return {Promise} A promise that is resolved with a {@link SecurityContext}
     * object representing the logged in participant, or rejected with a login error.
     */
    async login(enrollmentID, enrollmentSecret) {
        throw new Error('abstract function called');
    }

    /**
     * Install the Hyperledger Composer runtime.
     * @abstract
     * @param {SecurityContext} securityContext The participant's security context.
     * @param {string} networkDefinition The business network that will be installed.
     * @param {Object} installOptions connector specific installation options
     * @return {Promise} A promise that is resolved once the business network
     * artefacts have been installed, or rejected with an error.
     */
    async install(securityContext, networkDefinition, installOptions) {
        throw new Error('abstract function called');
    }

    /**
     * Start a business network definition.
     * @abstract
     * @param {SecurityContext} securityContext The participant's security context.
     * @param {string} networkName The name of the business network that will be started
     * @param {string} networkVersion The version of the business network that will be started
     * @param {string} startTransaction The serialized start transaction.
     * @param {Object} startOptions connector specific installation options
     * @return {Promise} A promise that is resolved once the business network
     * artefacts have been installed, or rejected with an error.
     */
    async start(securityContext, networkName, networkVersion, startTransaction, startOptions) {
        throw new Error('abstract function called');
    }

    /**
     * Undeploy a business network.
     * @abstract
     * @param {SecurityContext} securityContext The participant's security context.
     * @param {String} networkName The name of the business network to remove.
     * @return {Promise} Resolved when the network is undeployed.
     */
    async undeploy(securityContext, networkName) {
        throw new Error('abstract function called');
    }

    /**
     * Resets an existing deployed business network definition.
     * @abstract
     * @param {SecurityContext} securityContext The participant's security context.
     * @param {String} businessNetworkIdentifier The identifier of the business network
     * @return {Promise} A promise that is resolved once the business network
     * artefacts have been reset, or rejected with an error.
     */
    async reset(securityContext, businessNetworkIdentifier) {
        // create the new transaction to update the network
        if (!businessNetworkIdentifier) {
            throw new Error('business network identifier not specified');
        }

        let buffer = await Util.queryChainCode(securityContext, 'getBusinessNetwork', []);
        let businessNetworkJSON = JSON.parse(buffer.toString());
        let businessNetworkArchive = Buffer.from(businessNetworkJSON.data, 'base64');
        let currentDeployedNetwork = await BusinessNetworkDefinition.fromArchive(businessNetworkArchive);

        // Send an update request to the chaincode.
        // create the new system transaction to add the resources

        if (currentDeployedNetwork.getName() !== businessNetworkIdentifier){
            throw new Error('Incorrect Business Network Identifier');
        }

        let transaction = currentDeployedNetwork.getFactory().newTransaction('org.hyperledger.composer.system','ResetBusinessNetwork');
        return Util.submitTransaction(securityContext,transaction,currentDeployedNetwork.getSerializer());
    }

    /**
     * Sets the log level for a business network.
     * @abstract
     * @param {SecurityContext} securityContext The participant's security context.
     * @param {String} loglevel The new log level
     * @return {Promise} A promise that is resolved once the business network
     * logging level has been changed
     */
    async setLogLevel(securityContext, loglevel) {
        // create the new transaction to update the network
        if (!loglevel) {
            throw new Error('Log Level not specified');
        }

        let buffer = await Util.queryChainCode(securityContext, 'getBusinessNetwork', []);
        let businessNetworkJSON = JSON.parse(buffer.toString());
        let businessNetworkArchive = Buffer.from(businessNetworkJSON.data, 'base64');
        let currentDeployedNetwork = await BusinessNetworkDefinition.fromArchive(businessNetworkArchive);

        let transaction = currentDeployedNetwork.getFactory().newTransaction('org.hyperledger.composer.system','SetLogLevel');
        transaction.newLogLevel = loglevel;
        return Util.submitTransaction(securityContext,transaction,currentDeployedNetwork.getSerializer());
    }

    /**
     * Upgrade the Hyperledger Composer runtime.
     * @abstract
     * @param {SecurityContext} securityContext The participant's security context.
     * @param {String} networkName The name of the business network to upgrade.
     * @param {String} networkVersion The new version of the business network.
     * @param {object} upgradeOptions connector specific options
     * @return {Promise} A promise that is resolved once the business network
     * runtime has been upgraded, or rejected with an error.
     */
    async upgrade(securityContext, networkName, networkVersion, upgradeOptions) {
        throw new Error('abstract function called');
    }

    /**
     * Test ("ping") the connection to the business network.
     * @abstract
     * @param {SecurityContext} securityContext The participant's security context.
     * @return {Promise} A promise that is resolved once the connection to the
     * business network has been tested, or rejected with an error.
     */
    async ping(securityContext) {
        throw new Error('abstract function called');
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
    async queryChainCode(securityContext, functionName, args) {
        throw new Error('abstract function called');
    }

    /**
     * Invoke a "invoke" chaincode function with the specified name and arguments.
     * @abstract
     * @param {SecurityContext} securityContext The participant's security context.
     * @param {string} functionName The name of the chaincode function to invoke.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @param {Object} [options] Options for the invoking chaing code to use
     * @param {Object} [options.transactionId] Transaction Id to use.
     * @return {Promise} A promise that is resolved once the chaincode function
     * has been invoked, or rejected with an error.
     */
    async invokeChainCode(securityContext, functionName, args, options) {
        throw new Error('abstract function called');
    }

    /**
     * Return whether a registry check is required before executing createIdentity to prevent duplicates.
     * @return {boolean} false.
     */
    registryCheckRequired() {
        return false;
    }

    /**
     * Create a new identity for the specified user ID.
     * @abstract
     * @param {SecurityContext} securityContext The participant's security context.
     * @param {string} userID The user ID.
     * @param {object} [options] Options for the new identity.
     * @param {boolean} [options.issuer] Whether or not the new identity should have
     * permissions to create additional new identities. False by default.
     * @param {string} [options.affiliation] Specify the affiliation for the new
     * identity. Defaults to 'institution_a'.
     * @return {Promise} A promise that is resolved with a generated user
     * secret once the new identity has been created, or rejected with an error.
     */
    async createIdentity(securityContext, userID, options) {
        throw new Error('abstract function called');
    }

    /**
     * List all of the deployed business networks. The connection must
     * be connected for this method to succeed.
     * @abstract
     * @param {SecurityContext} securityContext The participant's security context.
     * @return {Promise} A promise that will be resolved with an array of
     * business network identifiers, or rejected with an error.
     */
    async list(securityContext) {
        throw new Error('abstract function called');
    }


    /**
     * Create a Transaction Id
     * @abstract
     * @param {SecurityContext} securityContext The participant's security context.
     * @return {Promise} A promise that will be resolved with a representation of the id
     */
    async createTransactionId(securityContext) {
        throw new Error('abstract function called');
    }

}

module.exports = Connection;
