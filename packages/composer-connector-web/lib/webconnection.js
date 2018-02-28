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

const { Certificate, CertificateUtil, Connection } = require('composer-common');
const Engine = require('composer-runtime').Engine;
const uuid = require('uuid');
const { WebContainer, WebContext, WebDataService } = require('composer-runtime-web');
const WebSecurityContext = require('./websecuritycontext');

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
    static reset () {
        for (let id in chaincodes) {
            delete chaincodes[id];
        }
    }

    /**
     * Delete the specified business network.
     * @param {string} businessNetworkIdentifier The business network identifier.
     */
    static deleteBusinessNetwork (businessNetworkIdentifier) {
        delete chaincodes[businessNetworkIdentifier];
    }

    /**
     * Add a chaincode.
     * @param {string} chaincodeID The chaincode ID.
     * @param {Container} container The container.
     * @param {Engine} engine The engine.
     */
    static addChaincode (chaincodeID, container, engine) {
        chaincodes[chaincodeID] = {
            id : chaincodeID,
            container : container,
            engine : engine
        };
    }

    /**
     * Get the specified chaincode.
     * @param {string} chaincodeID The chaincode ID.
     * @return {object} The chaincode.
     */
    static getChaincode (chaincodeID) {
        return chaincodes[chaincodeID];
    }

    /**
     * Create a new container.
     * @param {string} [uuid] The UUID to use.
     * @return {Container} The new container.
     */
    static createContainer (uuid) {
        return new WebContainer(uuid);
    }

    /**
     * Create a new engine.
     * @param {Container} container The container.
     * @return {Engine} The new engine.
     */
    static createEngine (container) {
        return new Engine(container);
    }

    /**
     * Constructor.
     * @param {ConnectionManager} connectionManager The owning connection manager.
     * @param {string} connectionProfile The name of the connection profile associated with this connection
     * @param {string} businessNetworkIdentifier The identifier of the business network for this connection
     */
    constructor (connectionManager, connectionProfile, businessNetworkIdentifier) {
        super(connectionManager, connectionProfile, businessNetworkIdentifier);
        this.dataService = new WebDataService(null, true);
    }

    /**
     * Terminate the connection to the business network.
     */
    async disconnect () {

    }

    /**
     * Login as a participant on the business network.
     * @param {string} enrollmentID The enrollment ID of the participant.
     * @param {string} enrollmentSecret The enrollment secret of the participant.
     * @return {Promise} A promise that is resolved with a {@link SecurityContext}
     * object representing the logged in participant, or rejected with a login error.
     */
    async login (enrollmentID, enrollmentSecret) {
        if (!this.businessNetworkIdentifier) {
            const identity = await this.testIdentity(enrollmentID, enrollmentSecret);
            return new WebSecurityContext(this, identity);
        }
        const identity = await this.testIdentity(enrollmentID, enrollmentSecret);
        if (!WebConnection.getChaincode(this.businessNetworkIdentifier)) {
            let container = WebConnection.createContainer(this.businessNetworkIdentifier);
            let engine = WebConnection.createEngine(container);
            WebConnection.addChaincode(this.businessNetworkIdentifier, container, engine);
        }
        const result = new WebSecurityContext(this, identity);
        result.setChaincodeID(this.businessNetworkIdentifier);
        return result;
    }

    /**
     * For the web connector, this is just a no-op, there is nothing to install
     * @param {SecurityContext} securityContext The participant's security context.
     * @param {string} businessNetworkIdentifier The identifier of the Business network that will be started in this installed runtime
     * @param {Object} installOptions connector specific install options
     */
    async install (securityContext, businessNetworkIdentifier, installOptions) {

    }

    /**
     * Deploy a business network. For the web connector this just translates to
     * a start request as no install is required.
     * @param {HFCSecurityContext} securityContext The participant's security context.
     * @param {string} businessNetworkIdentifier The identifier of the Business network that will be started in this installed runtime
     * @param {string} deployTransaction The serialized deploy transaction.
     * @param {Object} deployOptions connector specific deploy options
     */
    async deploy (securityContext, businessNetworkIdentifier, deployTransaction, deployOptions) {
        await this.start(securityContext, businessNetworkIdentifier, deployTransaction, deployOptions);
    }

    /**
     * Start a business network.
     * @param {HFCSecurityContext} securityContext The participant's security context.
     * @param {string} businessNetworkIdentifier The identifier of the Business network that will be started in this installed runtime
     * @param {string} startTransaction The serialized start transaction.
     * @param {Object} startOptions connector specific start options
     */
    async start (securityContext, businessNetworkIdentifier, startTransaction, startOptions) {
        let container = WebConnection.createContainer(businessNetworkIdentifier);
        let identity = securityContext.getIdentity();
        let containerName = container.getName();
        let engine = WebConnection.createEngine(container);
        WebConnection.addChaincode(containerName, container, engine);
        let context = new WebContext(engine, identity, this);
        try {
            await engine.init(context, 'init', [startTransaction]);
        } catch (error) {
            if (error.message.includes('as the object already exists')) {
                throw new Error('business network with name ' + businessNetworkIdentifier + ' already exists');
            } else {
                throw error;
            }
        }
    }

    /**
     * Undeploy a business network definition.
     * @abstract
     * @param {SecurityContext} securityContext The participant's security context.
     * @param {string} businessNetworkIdentifier The identifier of the business network to remove
     * @return {Promise} A promise that is resolved once the business network
     * artifacts have been undeployed, or rejected with an error.
     */
    async undeploy (securityContext, businessNetworkIdentifier) {
        WebConnection.deleteBusinessNetwork(businessNetworkIdentifier, this.connectionProfile);
        const dataServiceBusinessNetwork = new WebDataService(businessNetworkIdentifier, true);
        await dataServiceBusinessNetwork.destroy();
    }

    /**
     * Test ("ping") the connection to the business network.
     * @param {SecurityContext} securityContext The participant's security context.
     * @return {Promise} A promise that is resolved once the connection to the
     * business network has been tested, or rejected with an error.
     */
    async ping (securityContext) {
        const buffer = await this.queryChainCode(securityContext, 'ping', []);
        return JSON.parse(buffer.toString());
    }

    /**
     * Invoke a "query" chaincode function with the specified name and arguments.
     * @param {SecurityContext} securityContext The participant's security context.
     * @param {string} functionName The name of the chaincode function to invoke.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @return {Promise} A promise that is resolved with the data returned by the
     * chaincode function once it has been invoked, or rejected with an error.
     */
    async queryChainCode (securityContext, functionName, args) {
        let identity = securityContext.getIdentity();
        let chaincodeID = securityContext.getChaincodeID();
        let chaincode = WebConnection.getChaincode(chaincodeID);
        let context = new WebContext(chaincode.engine, identity, this);
        const data = await chaincode.engine.query(context, functionName, args);
        return Buffer.from(JSON.stringify(data));
    }

    /**
     * Invoke a "invoke" chaincode function with the specified name and arguments.
     * @param {SecurityContext} securityContext The participant's security context.
     * @param {string} functionName The name of the chaincode function to invoke.
     * @param {string[]} args The arguments to pass to the chaincode function.
     */
    async invokeChainCode (securityContext, functionName, args) {
        let identity = securityContext.getIdentity();
        let chaincodeID = securityContext.getChaincodeID();
        let chaincode = WebConnection.getChaincode(chaincodeID);
        let context = new WebContext(chaincode.engine, identity, this);
        await chaincode.engine.invoke(context, functionName, args);
    }

    /**
     * Get the data collection that stores identities.
     * @return {Promise} A promise that is resolved with the data collection
     * that stores identities.
     */
    async getIdentities () {
        return await this.dataService.ensureCollection('identities');
    }

    /**
     * Get the identity for the specified name.
     * @param {string} identityName The name for the identity.
     * @return {Promise} A promise that is resolved with the identity, or
     * rejected with an error.
     */
    async getIdentity (identityName) {
        const identities = await this.getIdentities();
        try {
            return await identities.get(identityName);
        } catch (error) {
            if (identityName === 'admin') {
                return await this._createAdminIdentity();
            }
            throw error;
        }
    }

    /**
     * Create the default admin identity.
     * @return {Promise} A promise that is resolved with the admin identity when complete,
     * or rejected with an error.
     */
    async _createAdminIdentity () {
        const { publicKey, privateKey, certificate } = CertificateUtil.generate({ commonName: 'admin' });
        const certificateObj = new Certificate(certificate);
        const identifier = certificateObj.getIdentifier();
        const name = certificateObj.getName();
        const issuer = certificateObj.getIssuer();
        const identity = {
            identifier,
            name,
            issuer,
            secret: 'adminpw',
            certificate,
            publicKey,
            privateKey,
            imported: false,
            options: {
                issuer: true
            }
        };
        const identities = await this.getIdentities();
        await identities.add('admin', identity);
        await identities.add(identifier, identity);
        return identity;
    }

    /**
     * Test the specified identity name and secret to ensure that it is valid.
     * @param {string} identityName The name for the identity.
     * @param {string} identitySecret The secret for the identity.
     * @return {Promise} A promise that is resolved if the user ID and secret
     * is valid, or rejected with an error.
     */
    async testIdentity (identityName, identitySecret) {
        const identity = await this.getIdentity(identityName);
        if (identity.imported) {
            return identity;
        } else if (identityName === 'admin') {
            return identity;
        } else if (identity.secret !== identitySecret) {
            throw new Error(`The secret ${identitySecret} specified for the identity ${identityName} does not match the stored secret ${identity.secret}`);
        } else {
            return identity;
        }
    }

    /**
     * Return whether a registry check is required before executing createIdentity to prevent duplicates.
     * @return {boolean} true.
     */
    registryCheckRequired() {
        return true;
    }

    /**
     * Create a new identity for the specified name.
     * @param {SecurityContext} securityContext The participant's security context.
     * @param {string} identityName The name for the new identity.
     * @param {object} [options] Options for the new identity.
     * @param {boolean} [options.issuer] Whether or not the new identity should have
     * permissions to create additional new identities. False by default.
     * @param {string} [options.affiliation] Specify the affiliation for the new
     * identity. Defaults to 'institution_a'.
     * @return {Promise} A promise that is resolved with a generated user
     * secret once the new identity has been created, or rejected with an error.
     */
    async createIdentity (securityContext, identityName, options) {
        const currentIdentity = securityContext.getIdentity();
        if (!currentIdentity.options.issuer) {
            throw new Error(`The identity ${currentIdentity.name} does not have permission to create a new identity ${identityName}`);
        }
        const identities = await this.getIdentities();
        const exists = await identities.exists(identityName);
        if (exists) {
            const identity = await identities.get(identityName);
            return {
                userID: identity.name,
                userSecret: identity.secret
            };
        }
        const { publicKey, privateKey, certificate } = CertificateUtil.generate({ commonName: identityName });
        const certificateObj = new Certificate(certificate);
        const identifier = certificateObj.getIdentifier();
        const name = certificateObj.getName();
        const issuer = certificateObj.getIssuer();
        const secret = uuid.v4().substring(0, 8);
        const identity = {
            identifier,
            name,
            issuer,
            secret,
            certificate,
            publicKey,
            privateKey,
            imported: false,
            options: options || {}
        };
        await identities.add(identityName, identity);
        await identities.add(identifier, identity);
        return {
            userID: identity.name,
            userSecret: identity.secret
        };
    }


    /**
     * Create a new transaction id
     * Note: as this is not a real fabric it returns null to let the composer-common use uuid to create one.
     * @param {SecurityContext} securityContext The participant's security context.
     * @return {Promise} A promise that is resolved with a transaction id
     */
    createTransactionId (securityContext) {
        return Promise.resolve(null);
    }
}

module.exports = WebConnection;
