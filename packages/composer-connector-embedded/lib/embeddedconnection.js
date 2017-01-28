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

const Connection = require('composer-common').Connection;
const Engine = require('composer-runtime').Engine;
const EmbeddedContainer = require('composer-runtime-embedded').EmbeddedContainer;
const EmbeddedContext = require('composer-runtime-embedded').EmbeddedContext;
const EmbeddedSecurityContext = require('./embeddedsecuritycontext');

// A mapping of business networks to chaincode IDs.
const businessNetworks = {};

// A mapping of chaincode IDs to their instance objects.
const chaincodes = {};

/**
 * Base class representing a connection to a business network.
 * @protected
 * @abstract
 */
class EmbeddedConnection extends Connection {

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
     * @param {string} chaincodeUUID The chaincode UUID.
     */
    static addBusinessNetwork(businessNetworkIdentifier, connectionProfile, chaincodeUUID) {
        businessNetworks[`${businessNetworkIdentifier}@${connectionProfile}`] = chaincodeUUID;
    }

    /**
     * Get the specified business network.
     * @param {string} businessNetworkIdentifier The business network identifier.
     * @param {string} connectionProfile The connection profile name.
     * @return {string} The chaincode UUID.
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
        let chaincodeUUID = businessNetworks[`${businessNetworkIdentifier}@${connectionProfile}`];
        if (chaincodeUUID) {
            delete chaincodes[chaincodeUUID];
            delete businessNetworks[`${businessNetworkIdentifier}@${connectionProfile}`];
        }
    }

    /**
     * Add a chaincode.
     * @param {string} chaincodeUUID The chaincode UUID.
     * @param {Container} container The container.
     * @param {Engine} engine The engine.
     */
    static addChaincode(chaincodeUUID, container, engine) {
        chaincodes[chaincodeUUID] = {
            uuid: chaincodeUUID,
            container: container,
            engine: engine
        };
    }

    /**
     * Get the specified chaincode.
     * @param {string} chaincodeUUID The chaincode UUID.
     * @return {object} The chaincode.
     */
    static getChaincode(chaincodeUUID) {
        return chaincodes[chaincodeUUID];
    }

    /**
     * Create a new container.
     * @return {Container} The new container.
     */
    static createContainer() {
        return new EmbeddedContainer();
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
        let result = new EmbeddedSecurityContext(this);
        if (this.businessNetworkIdentifier) {
            let chaincodeUUID = EmbeddedConnection.getBusinessNetwork(this.businessNetworkIdentifier, this.connectionProfile);
            if (chaincodeUUID) {
                result.setChaincodeID(chaincodeUUID);
            } else {
                return Promise.reject(new Error(`No chaincode ID found for business network '${this.businessNetworkIdentifier}'`));
            }
        }
        return Promise.resolve(result);
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
        let container = EmbeddedConnection.createContainer();
        let chaincodeUUID = container.getUUID();
        let engine = EmbeddedConnection.createEngine(container);
        EmbeddedConnection.addBusinessNetwork(businessNetwork.getName(), this.connectionProfile, chaincodeUUID);
        EmbeddedConnection.addChaincode(chaincodeUUID, container, engine);
        let context = new EmbeddedContext(engine);
        return businessNetwork.toArchive()
            .then((businessNetworkArchive) => {
                return engine.init(context, 'init', [businessNetworkArchive.toString('base64')]);
            })
            .then(() => {
                securityContext.setChaincodeID(chaincodeUUID);
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
        EmbeddedConnection.deleteBusinessNetwork(businessNetworkIdentifier, this.connectionProfile);
        return Promise.resolve();
    }

    /**
     * Test ("ping") the connection to the business network.
     * @param {SecurityContext} securityContext The participant's security context.
     * @return {Promise} A promise that is resolved once the connection to the
     * business network has been tested, or rejected with an error.
     */
    ping(securityContext) {
        return this.queryChainCode(securityContext, 'ping', [])
            .then((buffer) => {
                return JSON.parse(buffer.toString());
            });
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
        let chaincodeUUID = securityContext.getChaincodeID();
        let chaincode = EmbeddedConnection.getChaincode(chaincodeUUID);
        let context = new EmbeddedContext(chaincode.engine);
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
        let chaincodeUUID = securityContext.getChaincodeID();
        let chaincode = EmbeddedConnection.getChaincode(chaincodeUUID);
        let context = new EmbeddedContext(chaincode.engine);
        return chaincode.engine.invoke(context, functionName, args)
            .then((data) => {
                return undefined;
            });
    }

}

module.exports = EmbeddedConnection;
