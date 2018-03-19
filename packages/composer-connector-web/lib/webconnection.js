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
const { Engine, InstalledBusinessNetwork } = require('composer-runtime');
const uuid = require('uuid');
const { WebContainer, WebContext, WebDataService } = require('composer-runtime-web');
const WebSecurityContext = require('./websecuritycontext');

// A mapping of chaincode IDs to their instance objects.
const installedChaincodes = new Map();
// Map of business network names to chaincode IDs
const startedChaincodes = new Map();

/**
 * Base class representing a connection to a business network.
 * @protected
 * @abstract
 */
class WebConnection extends Connection {
    /**
     * Reset the static state of the WebConnection. Used only for unit testing.
     * @private
     */
    static _reset() {
        installedChaincodes.clear();
        startedChaincodes.clear();
    }

    /**
     * Delete all installed chaincode for the specified business network.
     * @param {String} networkName business network name.
     */
    static deleteChaincodeForNetwork(networkName) {
        startedChaincodes.delete(networkName);

        const networkMatch = networkName + '@';
        for (let networkId of installedChaincodes.keys()) {
            if (networkId.startsWith(networkMatch)) {
                installedChaincodes.delete(networkId);
            }
        }
    }

    /**
     * Start installed chaincode for a business network.
     * @param {String} networkName business network name.
     * @param {String} networkVersion business network version.
     * @return {Object} chaincode.
     */
    static startChaincode(networkName, networkVersion) {
        if (startedChaincodes.has(networkName)) {
            throw new Error('Chaincode already started: ' + networkName + '@' + startedChaincodes.get(networkName));
        }
        return WebConnection._setActiveChaincodeVersion(networkName, networkVersion);
    }

    /**
     * Upgrade previously started chaincode for a business network.
     * @param {String} networkName business network name.
     * @param {String} networkVersion business network version.
     * @return {Object} chaincode.
     */
    static upgradeChaincode(networkName, networkVersion) {
        if (!startedChaincodes.has(networkName)) {
            throw new Error('Chaincode not yet started: ' + networkName);
        }
        return WebConnection._setActiveChaincodeVersion(networkName, networkVersion);
    }

    /**
     * Mark the currently active (started) chaincode version for a business network.
     * @param {String} networkName business network name.
     * @param {String} networkVersion business network version.
     * @return {Object} chaincode.
     */
    static _setActiveChaincodeVersion(networkName, networkVersion) {
        const networkId = networkName + '@' + networkVersion;
        const chaincode = installedChaincodes.get(networkId);
        if (!chaincode) {
            throw new Error('Chaincode not installed: ' + networkId);
        }

        startedChaincodes.set(networkName, networkVersion);
        return chaincode;
    }

    /**
     * Install chaincode for a business network.
     * @param {InstalledBusinessNetwork} installedNetwork Information about the business network
     */
    static installChaincode(installedNetwork) {
        const networkId = installedNetwork.getDefinition().getIdentifier();
        if (installedChaincodes.has(networkId)) {
            throw new Error('Chaincode already installed: ' + networkId);
        }

        const networkName = installedNetwork.getDefinition().getName();
        const container = WebConnection.createContainer(networkName);
        const engine = WebConnection.createEngine(container);

        installedChaincodes.set(networkId, {
            id: networkId,
            installedNetwork: installedNetwork,
            container: container,
            engine: engine
        });
    }

    /**
     * Get the chaincode information for a started business network.
     * @param {String} networkName business network name.
     * @return {Object} The chaincode.
     */
    static getActiveChaincode(networkName) {
        const networkVersion = startedChaincodes.get(networkName);
        if (!networkVersion) {
            throw new Error('Chaincode not started: ' + networkName);
        }

        const networkId = networkName + '@' + networkVersion;
        return WebConnection.getInstalledChaincode(networkId);
    }

    /**
     * Get the chaincode information for an installed business network.
     * @param {String} networkId Business network identifier.
     * @return {Object} The chaincode.
     */
    static getInstalledChaincode(networkId) {
        return installedChaincodes.get(networkId);
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
        this.dataService = new WebDataService(null, true);
    }

    /**
     * Terminate the connection to the business network.
     * @async
     */
    async disconnect() {

    }

    /**
     * Login as a participant on the business network.
     * @param {string} enrollmentID The enrollment ID of the participant.
     * @param {string} enrollmentSecret The enrollment secret of the participant.
     * @return {Promise} A promise that is resolved with a {@link SecurityContext}
     * object representing the logged in participant, or rejected with a login error.
     * @async
     */
    async login(enrollmentID, enrollmentSecret) {
        const identity = await this.testIdentity(enrollmentID, enrollmentSecret);
        if (!this.businessNetworkIdentifier) {
            return new WebSecurityContext(this, identity);
        }
        const networkName = this.businessNetworkIdentifier.split('@')[0];
        // Ensure the network is installed and started
        WebConnection.getActiveChaincode(networkName);
        const result = new WebSecurityContext(this, identity);
        result.setNetworkName(networkName);
        return result;
    }

    /**
     * For the web connector, this is just a no-op, there is nothing to install
     * @param {SecurityContext} securityContext The participant's security context.
     * @param {BusinessNetworkDefinition} networkDefinition The  Business network to install
     * @param {Object} installOptions connector specific install options
     * @async
     */
    async install(securityContext, networkDefinition, installOptions) {
        const installedNetwork = await InstalledBusinessNetwork.newInstance(networkDefinition);
        WebConnection.installChaincode(installedNetwork);
    }

    /**
     * Start a business network.
     * @param {HFCSecurityContext} securityContext The participant's security context.
     * @param {string} networkName The name of the business network to start.
     * @param {String} networkVersion The version of the business network to start.
     * @param {string} startTransaction The serialized start transaction.
     * @param {Object} startOptions connector specific start options
     * @async
     */
    async start(securityContext, networkName, networkVersion, startTransaction, startOptions) {
        const chaincode = WebConnection.startChaincode(networkName, networkVersion);
        const engine = chaincode.engine;
        const identity = securityContext.getIdentity();
        let context = new WebContext(engine, chaincode.installedNetwork, identity, this);
        try {
            await engine.init(context, 'start', [startTransaction]);
        } catch (error) {
            if (error.message.includes('as the object already exists')) {
                throw new Error('business network with name ' + networkName + ' already exists');
            } else {
                throw error;
            }
        }
    }

    /**
     * Undeploy a business network definition.
     * @param {SecurityContext} securityContext The participant's security context.
     * @param {String} networkName Name of the business network to remove
     * @async
     */
    async undeploy(securityContext, networkName) {
        await new WebDataService(networkName, true).destroy();
        WebConnection.deleteChaincodeForNetwork(networkName);
    }

    /**
     * Test ("ping") the connection to the business network.
     * @param {SecurityContext} securityContext The participant's security context.
     * @return {Promise} A promise that is resolved once the connection to the
     * business network has been tested, or rejected with an error.
     * @async
     */
    async ping(securityContext) {
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
     * @async
     */
    async queryChainCode(securityContext, functionName, args) {
        const identity = securityContext.getIdentity();
        const networkName = securityContext.getNetworkName();
        const chaincode = WebConnection.getActiveChaincode(networkName);
        const context = new WebContext(chaincode.engine, chaincode.installedNetwork, identity, this);
        const data = await chaincode.engine.query(context, functionName, args);
        return Buffer.from(JSON.stringify(data));
    }

    /**
     * Invoke a "invoke" chaincode function with the specified name and arguments.
     * @param {SecurityContext} securityContext The participant's security context.
     * @param {string} functionName The name of the chaincode function to invoke.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @async
     */
    async invokeChainCode(securityContext, functionName, args) {
        const identity = securityContext.getIdentity();
        const networkName = securityContext.getNetworkName();
        const chaincode = WebConnection.getActiveChaincode(networkName);
        const context = new WebContext(chaincode.engine, chaincode.installedNetwork, identity, this);
        await chaincode.engine.invoke(context, functionName, args);
    }

    /**
     * Get the data collection that stores identities.
     * @return {Object} the data collection.
     * @async
     */
    async getIdentities() {
        return await this.dataService.ensureCollection('identities');
    }

    /**
     * Get the identity for the specified name.
     * @param {string} identityName The name for the identity.
     * @return {Object} the identity.
     * @async
     */
    async getIdentity(identityName) {
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
     * @return {Object} the admin identity.
     * @async
     */
    async _createAdminIdentity() {
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
    async testIdentity(identityName, identitySecret) {
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
     * @async
     */
    async createIdentity(securityContext, identityName, options) {
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
    createTransactionId(securityContext) {
        return Promise.resolve(null);
    }
}

module.exports = WebConnection;
