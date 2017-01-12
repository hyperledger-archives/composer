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

const Connection = require('@ibm/concerto-common').Connection;
const Engine = require('@ibm/concerto-runtime').Engine;
const WebContainer = require('@ibm/concerto-runtime-web').WebContainer;
const WebContext = require('@ibm/concerto-runtime-web').WebContext;
const WebSecurityContext = require('./websecuritycontext');

// A mapping of business networks to chaincode IDs.
const businessNetworks = {};

// A mapping of chaincode IDs to their instance objects.
const chaincodes = {};

/**
 * Base class representing a connection to a business network.
 * @protected
 * @abstract
 */
class WebConnection extends Connection {

    /**
     * Clear any registered business networks and chaincodes.
     */
    static reset() {
        for (let id in businessNetworks) {
            delete businessNetworks[id];
        }
        for (let id in chaincodes) {
            delete chaincodes[id];
        }
    }

    /**
     * Add a business network.
     * @param {string} businessNetworkIdentifier The business network identifier.
     * @param {string} connectionProfile The connection profile name.
     * @param {string} chaincodeID The chaincode ID.
     */
    static addBusinessNetwork(businessNetworkIdentifier, connectionProfile, chaincodeID) {
        businessNetworks[`${businessNetworkIdentifier}@${connectionProfile}`] = chaincodeID;
    }

    /**
     * Get the specified business network.
     * @param {string} businessNetworkIdentifier The business network identifier.
     * @param {string} connectionProfile The connection profile name.
     * @return {string} The chaincode ID.
     */
    static getBusinessNetwork(businessNetworkIdentifier, connectionProfile) {
        return businessNetworks[`${businessNetworkIdentifier}@${connectionProfile}`];
    }

    /**
     * Delete the specified business network.
     * @param {string} businessNetworkIdentifier The business network identifier.
     * @param {string} connectionProfile The connection profile name.
     */
    static deleteBusinessNetwork(businessNetworkIdentifier, connectionProfile) {
        let chaincodeID = businessNetworks[`${businessNetworkIdentifier}@${connectionProfile}`];
        if (chaincodeID) {
            delete chaincodes[chaincodeID];
            delete businessNetworks[`${businessNetworkIdentifier}@${connectionProfile}`];
        }
    }

    /**
     * Add a chaincode.
     * @param {string} chaincodeID The chaincode ID.
     * @param {Container} container The container.
     * @param {Engine} engine The engine.
     */
    static addChaincode(chaincodeID, container, engine) {
        chaincodes[chaincodeID] = {
            id: chaincodeID,
            container: container,
            engine: engine
        };
    }

    /**
     * Get the specified chaincode.
     * @param {string} chaincodeID The chaincode ID.
     * @return {object} The chaincode.
     */
    static getChaincode(chaincodeID) {
        return chaincodes[chaincodeID];
    }

    /**
     * Create a new container.
     * @param {string} [uuid] The UUID to use.
     * @return {Container} The new container.
     */
    static createContainer(uuid) {
        return new WebContainer(uuid);
    }

    /**
     * Create a new engine.
     * @param {Container} container The container.
     * @return {Engine} The new engine.
     */
    static createEngine(container) {
        return new Engine(container);
    }

    /**
     * Constructor.
     * @param {ConnectionManager} connectionManager The owning connection manager.
     * @param {string} connectionProfile The name of the connection profile associated with this connection
     * @param {string} businessNetworkIdentifier The identifier of the business network for this connection
     */
    constructor(connectionManager, connectionProfile, businessNetworkIdentifier) {
        super(connectionManager, connectionProfile, businessNetworkIdentifier);
    }

    /**
     * Terminate the connection to the business network.
     * @return {Promise} A promise that is resolved once the connection has been
     * terminated, or rejected with an error.
     */
    disconnect() {
        return Promise.resolve();
    }

    /**
     * Login as a participant on the business network.
     * @param {string} enrollmentID The enrollment ID of the participant.
     * @param {string} enrollmentSecret The enrollment secret of the participant.
     * @return {Promise} A promise that is resolved with a {@link SecurityContext}
     * object representing the logged in participant, or rejected with a login error.
     */
    login(enrollmentID, enrollmentSecret) {
        let result = new WebSecurityContext(this);
        if (this.businessNetworkIdentifier) {
            return this.getChaincodeID(this.businessNetworkIdentifier)
                .then((chaincodeID) => {
                    if (chaincodeID) {
                        if (!WebConnection.getBusinessNetwork(this.businessNetworkIdentifier, this.connectionProfile)) {
                            let container = WebConnection.createContainer(chaincodeID);
                            let engine = WebConnection.createEngine(container);
                            WebConnection.addBusinessNetwork(this.businessNetworkIdentifier, this.connectionProfile, chaincodeID);
                            WebConnection.addChaincode(chaincodeID, container, engine);
                        }
                        result.setChaincodeID(chaincodeID);
                    } else {
                        throw new Error(`No chaincode ID found for business network '${this.businessNetworkIdentifier}'`);
                    }
                    return result;
                });
        } else {
            return Promise.resolve(result);
        }
    }

    /**
     * Deploy all business network artifacts.
     * @param {HFCSecurityContext} securityContext The participant's security context.
     * @param {boolean} [force] Force the deployment of the business network artifacts.
     * @param {BusinessNetwork} businessNetwork The BusinessNetwork to deploy
     * @return {Promise} A promise that is resolved once the business network
     * artifacts have been deployed, or rejected with an error.
     */
    deploy(securityContext, force, businessNetwork) {
        let container = WebConnection.createContainer();
        let chaincodeID = container.getUUID();
        let engine = WebConnection.createEngine(container);
        WebConnection.addBusinessNetwork(businessNetwork.getName(), this.connectionProfile, chaincodeID);
        WebConnection.addChaincode(chaincodeID, container, engine);
        let context = new WebContext(engine);
        return businessNetwork.toArchive()
            .then((businessNetworkArchive) => {
                return engine.init(context, 'init', [businessNetworkArchive.toString('base64')]);
            })
            .then(() => {
                return this.setChaincodeID(businessNetwork.getName(), chaincodeID);
            })
            .then(() => {
                securityContext.setChaincodeID(chaincodeID);
                return this.ping(securityContext);
            });
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
        return businessNetworkDefinition.toArchive()
            .then((buffer) => {
                return this.invokeChainCode(securityContext, 'updateBusinessNetwork', [buffer.toString('base64')]);
            });
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
        WebConnection.deleteBusinessNetwork(businessNetworkIdentifier, this.connectionProfile);
        return this.deleteChaincodeID(businessNetworkIdentifier);
    }

    /**
     * Test ("ping") the connection to the business network.
     * @param {SecurityContext} securityContext The participant's security context.
     * @return {Promise} A promise that is resolved once the connection to the
     * business network has been tested, or rejected with an error.
     */
    ping(securityContext) {
        return this.queryChainCode(securityContext, 'ping', []);
    }

    /**
     * Invoke a "query" chaincode function with the specified name and arguments.
     * @param {SecurityContext} securityContext The participant's security context.
     * @param {string} functionName The name of the chaincode function to invoke.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @return {Promise} A promise that is resolved with the data returned by the
     * chaincode function once it has been invoked, or rejected with an error.
     */
    queryChainCode(securityContext, functionName, args) {
        let chaincodeID = securityContext.getChaincodeID();
        let chaincode = WebConnection.getChaincode(chaincodeID);
        let context = new WebContext(chaincode.engine);
        return chaincode.engine.query(context, functionName, args)
            .then((data) => {
                return Buffer.from(JSON.stringify(data));
            });
    }

    /**
     * Invoke a "invoke" chaincode function with the specified name and arguments.
     * @param {SecurityContext} securityContext The participant's security context.
     * @param {string} functionName The name of the chaincode function to invoke.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @return {Promise} A promise that is resolved once the chaincode function
     * has been invoked, or rejected with an error.
     */
    invokeChainCode(securityContext, functionName, args) {
        let chaincodeID = securityContext.getChaincodeID();
        let chaincode = WebConnection.getChaincode(chaincodeID);
        let context = new WebContext(chaincode.engine);
        return chaincode.engine.invoke(context, functionName, args)
            .then((data) => {
                return undefined;
            });
    }

    /**
     * List all of the deployed business networks. The connection must
     * be connected for this method to succeed.
     * @param {SecurityContext} securityContext The participant's security context.
     * @return {Promise} A promise that will be resolved with an array of
     * business network identifiers, or rejected with an error.
     */
    list(securityContext) {
        return this.getConnectionManager().getConnectionProfileManager().getConnectionProfileStore().load(this.connectionProfile)
            .then((profile) => {
                profile.networks = profile.networks || {};
                return Object.keys(profile.networks).sort();
            });
    }

    /**
     * Get the chaincode ID for the specified business network.
     * @param {string} businessNetworkIdentifier The identifier of the business network.
     * @return {Promise} A promise that will be resolved with the chaincode ID, or
     * rejected with an error.
     */
    getChaincodeID(businessNetworkIdentifier) {
        return this.getConnectionManager().getConnectionProfileManager().getConnectionProfileStore().load(this.connectionProfile)
            .then((profile) => {
                profile.networks = profile.networks || {};
                let chaincodeID = profile.networks[businessNetworkIdentifier];
                return chaincodeID;
            });
    }

    /**
     * Set the chaincode ID for the specified business network.
     * @param {string} businessNetworkIdentifier The identifier of the business network.
     * @param {string} chaincodeID The chaincode ID for the business network.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    setChaincodeID(businessNetworkIdentifier, chaincodeID) {
        return this.getConnectionManager().getConnectionProfileManager().getConnectionProfileStore().load(this.connectionProfile)
            .then((profile) => {
                profile.networks = profile.networks || {};
                profile.networks[businessNetworkIdentifier] = chaincodeID;
                return this.connectionManager.getConnectionProfileManager().getConnectionProfileStore().save(this.connectionProfile, profile);
            });
    }

    /**
     * Delete the chaincode ID for the specified business network.
     * @param {string} businessNetworkIdentifier The identifier of the business network.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    deleteChaincodeID(businessNetworkIdentifier) {
        return this.getConnectionManager().getConnectionProfileManager().getConnectionProfileStore().load(this.connectionProfile)
            .then((profile) => {
                delete profile.networks[businessNetworkIdentifier];
                return this.connectionManager.getConnectionProfileManager().getConnectionProfileStore().save(this.connectionProfile, profile);
            });
    }

}

module.exports = WebConnection;
