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

const { Certificate, CertificateUtil, Connection, Util } = require('composer-common');
const { Engine, InstalledBusinessNetwork } = require('composer-runtime');
const uuid = require('uuid');
const { WebContainer, WebContext, WebDataService } = require('composer-runtime-web');
const ChaincodeStore = require('./chaincodestore');
const WebSecurityContext = require('./websecuritycontext');

/**
 * Represents a Web profile connection to a business network.
 * @protected
 */
class WebConnection extends Connection {
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
        this.dataService = WebDataService.newComposerDataService();
        this.savedNetwork = null;
    }

    /**
     * Get the chaincode store used to manage install, start and undeploy of chaincode.
     * @return {ChaincodeStore} chaincode store.
     */
    async getChaincodeStore() {
        const collection = await this.dataService.ensureCollection('chaincodes');
        return new ChaincodeStore(collection);
    }

    /**
     * Terminate the connection to the business network.
     * @async
     */
    async disconnect() {
        this.engine = null;
        this.installedNetwork = null;
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

        const networkName = this.businessNetworkIdentifier;
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
        const chaincodeStore = await this.getChaincodeStore();
        await chaincodeStore.install(networkDefinition);
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
        const chaincodeStore = await this.getChaincodeStore();
        const networkDefinition = await chaincodeStore.start(networkName, networkVersion);

        const container = WebConnection.createContainer(networkName);
        const engine = WebConnection.createEngine(container);
        const identity = securityContext.getIdentity();
        const installedNetwork = await InstalledBusinessNetwork.newInstance(networkDefinition);

        const context = new WebContext(engine, installedNetwork, identity, this);
        await engine.init(context, 'start', [startTransaction]);
    }

    /**
     * Upgrade a business network.
     * @param {HFCSecurityContext} securityContext The participant's security context.
     * @param {string} networkName The name of the business network to start.
     * @param {String} networkVersion The version of the business network to start.
     * @param {Object} upgradeOptions connector specific start options
     * @async
     */
    async upgrade(securityContext, networkName, networkVersion, upgradeOptions) {
        const chaincodeStore = await this.getChaincodeStore();
        const networkDefinition = await chaincodeStore.upgrade(networkName, networkVersion);

        const container = WebConnection.createContainer(networkName);
        const engine = WebConnection.createEngine(container);
        const identity = securityContext.getIdentity();
        const installedNetwork = await InstalledBusinessNetwork.newInstance(networkDefinition);

        const context = new WebContext(engine, installedNetwork, identity, this);
        await engine.init(context, 'upgrade');
    }

    /**
     * Undeploy a business network definition.
     * @param {SecurityContext} securityContext The participant's security context.
     * @param {String} networkName Name of the business network to remove
     * @async
     */
    async undeploy(securityContext, networkName) {
        await WebDataService.newNetworkDataService(networkName, true).removeAllData();
        const chaincodeStore = await this.getChaincodeStore();
        await chaincodeStore.removeNetwork(networkName);
        this.savedNetwork = null;
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
     * @return {Buffer} A buffer containing the data returned by the chaincode function,
     * or null if no data was returned.
     */
    async queryChainCode(securityContext, functionName, args) {
        const identity = securityContext.getIdentity();
        const networkInfo = await this._getNetworkInfo(securityContext.getNetworkName());
        const context = new WebContext(networkInfo.engine, networkInfo.installedNetwork, identity, this);
        const data = await networkInfo.engine.query(context, functionName, args);
        return !Util.isNull(data) ? Buffer.from(JSON.stringify(data)) : null;
    }

    /**
     * Get saved details related to the current business network.
     * @param {String} networkName business network name.
     * @return {Object} network information in the form { name, engine, installedNetwork }.
     * @async
     */
    async _getNetworkInfo(networkName) {
        if (!this.savedNetwork || this.savedNetwork.name !== networkName) {
            const container = WebConnection.createContainer(networkName);

            const chaincodeStore = await this.getChaincodeStore();
            const networkDefinition = await chaincodeStore.getStartedChaincode(networkName);

            this.savedNetwork = {
                name: networkName,
                engine: WebConnection.createEngine(container),
                installedNetwork: await InstalledBusinessNetwork.newInstance(networkDefinition)
            };
        }

        return this.savedNetwork;
    }

    /**
     * Invoke a "invoke" chaincode function with the specified name and arguments.
     * @param {SecurityContext} securityContext The participant's security context.
     * @param {string} functionName The name of the chaincode function to invoke.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @return {Buffer} A buffer containing the data returned by the chaincode function,
     * or null if no data was returned.
     */
    async invokeChainCode(securityContext, functionName, args) {
        const identity = securityContext.getIdentity();
        const networkInfo = await this._getNetworkInfo(securityContext.getNetworkName());
        const context = new WebContext(networkInfo.engine, networkInfo.installedNetwork, identity, this);
        const data = await networkInfo.engine.invoke(context, functionName, args);
        return !Util.isNull(data) ? Buffer.from(JSON.stringify(data)) : null;
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

    /**
     * Get the native API for this connection. The native API returned is specific
     * to the underlying blockchain platform, and may throw an error if there is no
     * native API available.
     */
    getNativeAPI() {
        throw new Error('native API not available when using the web connector');
    }

}

module.exports = WebConnection;
