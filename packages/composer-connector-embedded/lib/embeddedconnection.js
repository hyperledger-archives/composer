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
const { EmbeddedContainer, EmbeddedContext, EmbeddedDataService } = require('composer-runtime-embedded');
const EmbeddedSecurityContext = require('./embeddedsecuritycontext');
const { Engine, InstalledBusinessNetwork } = require('composer-runtime');
const uuid = require('uuid');

// A map of installed chaincodes keyed by name and version
const installedChaincodes = new Map();

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
        installedChaincodes.clear();
    }

    /**
     * Add chaincode package to the list of installed chaincodes, keyed off of the name and version only.
     * @param {BusinessNetworkDefinition} businessNetworkDefinition the business network definition which defines the chaincode
     */
    static addInstalledChaincode(businessNetworkDefinition) {
        const key = `${businessNetworkDefinition.getName()}@${businessNetworkDefinition.getVersion()}`;
        installedChaincodes.set(key, businessNetworkDefinition);
    }

    /**
     * Retrieve a business network definition chaincode keyed off name and version.∂
     * @param {string} name The name of the chaincode to retrieve
     * @param {string} version The version of the chaincode to retrieve
     * @returns {BusinessNetworkDefinition} A business network definition chaincode or null if not found.
     */
    static getInstalledChaincode(name, version) {
        return installedChaincodes.get(`${name}@${version}`);
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
     * Add a chaincode.
     * @param {string} chaincodeUUID The chaincode UUID.
     * @param {Container} container The container.
     * @param {Engine} engine The engine.
     * @param {InstalledBusinessNetwork} ibn The Installed Business Network
     */
    static addChaincode(chaincodeUUID, container, engine, ibn) {
        chaincodes[chaincodeUUID] = {
            uuid: chaincodeUUID,
            container: container,
            engine: engine,
            installedBusinessNetwork : ibn
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
        this.dataService = new EmbeddedDataService(null, true);
    }

    /**
     * Terminate the connection to the business network.
     */
    async disconnect() {

    }

    /**
     * Login as a participant on the business network.
     * @param {string} enrollmentID The enrollment ID of the participant.
     * @param {string} enrollmentSecret The enrollment secret of the participant.
     * @return {Promise} A promise that is resolved with a {@link SecurityContext}
     * object representing the logged in participant, or rejected with a login error.
     */
    async login(enrollmentID, enrollmentSecret) {
        const identity = await this.testIdentity(enrollmentID, enrollmentSecret);

        // no businessNetworkIdentitier implies fabric identity, not an identity
        // that can be enrolled and should already be imported.
        if (!this.businessNetworkIdentifier) {
            return new EmbeddedSecurityContext(this, identity);
        }
        let chaincodeUUID = EmbeddedConnection.getBusinessNetwork(this.businessNetworkIdentifier, this.connectionProfile);
        if (!chaincodeUUID) {
            throw new Error(`No chaincode ID found for business network '${this.businessNetworkIdentifier}'`);
        }

        // simulate enrolment and import which would occur on a login if
        // no imported credentials. Note that no enrolment counting is done in
        // this simulation.
        if (!identity.imported) {
            identity.imported = true;
            const identities = await this.getIdentities();
            await identities.update(enrollmentID, identity);
        }
        const result = new EmbeddedSecurityContext(this, identity);
        result.setChaincodeID(chaincodeUUID);
        return result;
    }

    /**
     * For the embedded connector, this is just a no-op, there is nothing to install. *** I Don't think this is true now ***
     * @param {SecurityContext} securityContext The participant's security context.
     * @param {string} businessNetworkDefinition The business network definition that will be started
     * @param {Object} installOptions connector specific installation options
     * @returns {Promise} returns a resolved promise to indicate success
     */
    async install(securityContext, businessNetworkDefinition, installOptions) {
        EmbeddedConnection.addInstalledChaincode(businessNetworkDefinition);
        return Promise.resolve();
    }

    /**
     * Start a business network.
     * @param {HFCSecurityContext} securityContext The participant's security context.
     * @param {string} businessNetworkIdentifier The identifier of the Business network that will be started in this installed runtime
     * @param {string} businessNetworkVersion The version of the Business network that will be started in this installed runtime
     * @param {string} startTransaction The serialized start transaction.
     * @param {Object} startOptions connector specific start options
     */
    async start(securityContext, businessNetworkIdentifier, businessNetworkVersion, startTransaction, startOptions) {
        const installedChaincode = EmbeddedConnection.getInstalledChaincode(businessNetworkIdentifier, businessNetworkVersion);
        if (!installedChaincode) {
            throw new Error(`${businessNetworkIdentifier} version ${businessNetworkVersion} has not been installed`);
        }
        const installedBusinessNetwork = await InstalledBusinessNetwork.newInstance(installedChaincode);

        const container = EmbeddedConnection.createContainer();
        const identity = securityContext.getIdentity();
        const chaincodeUUID = container.getUUID();
        const engine = EmbeddedConnection.createEngine(container);

        EmbeddedConnection.addBusinessNetwork(businessNetworkIdentifier, this.connectionProfile, chaincodeUUID);
        EmbeddedConnection.addChaincode(chaincodeUUID, container, engine, installedBusinessNetwork);

        let context = new EmbeddedContext(engine, identity, this, installedBusinessNetwork);
        await engine.init(context, 'start', [startTransaction]);
    }

    /**
     * Upgrade a business network. This connector implementation effectively allows you to
     * switch between installed chaincodes, and doesn't complain even if you switch to the
     * same chaincode.
     * @param {HFCSecurityContext} securityContext The participant's security context.
     * @param {string} businessNetworkIdentifier The name of the business network to upgrade.
     * @param {String} businessNetworkVersion The version of the business network to upgrade.
     * @param {Object} upgradeOptions connector specific start options
     * @async
     */
    async upgrade(securityContext, businessNetworkIdentifier, businessNetworkVersion, upgradeOptions) {
        let installedChaincode = EmbeddedConnection.getInstalledChaincode(businessNetworkIdentifier, businessNetworkVersion);
        if (!installedChaincode) {
            throw new Error(`${businessNetworkIdentifier} version ${businessNetworkVersion} has not been installed`);
        }
        let chaincodeUUID = EmbeddedConnection.getBusinessNetwork(businessNetworkIdentifier, this.connectionProfile);
        if (!chaincodeUUID) {
            throw new Error(`Unable to upgrade, ${businessNetworkIdentifier} has not been started`);
        }

        const {container, engine} = EmbeddedConnection.getChaincode(chaincodeUUID);
        let installedBusinessNetwork = await InstalledBusinessNetwork.newInstance(installedChaincode);

        // This adds or replaces
        EmbeddedConnection.addChaincode(chaincodeUUID, container, engine, installedBusinessNetwork);
        const identity = securityContext.getIdentity();
        let context = new EmbeddedContext(engine, identity, this, installedBusinessNetwork);
        await engine.init(context, 'upgrade');
    }

    /**
     * Test ("ping") the connection to the business network.
     * @param {SecurityContext} securityContext The participant's security context.
     * @return {Promise} A promise that is resolved once the connection to the
     * business network has been tested, or rejected with an error.
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
        if (!this.businessNetworkIdentifier) {
            throw new Error('No business network has been specified for this connection');
        }
        let identity = securityContext.getIdentity();
        let chaincodeUUID = securityContext.getChaincodeID();
        let chaincode = EmbeddedConnection.getChaincode(chaincodeUUID);
        let context = new EmbeddedContext(chaincode.engine, identity, this, chaincode.installedBusinessNetwork);
        const data = await chaincode.engine.query(context, functionName, args);
        return !Util.isNull(data) ? Buffer.from(JSON.stringify(data)) : null;
    }

    /**
     * Invoke a "invoke" chaincode function with the specified name and arguments.
     * @param {SecurityContext} securityContext The participant's security context.
     * @param {string} functionName The name of the chaincode function to invoke.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @param {Object} [additionalConnectorOptions] Additional connector specific options for this transaction.
     * @return {Buffer} A buffer containing the data returned by the chaincode function,
     * or null if no data was returned.
     */
    async invokeChainCode(securityContext, functionName, args, additionalConnectorOptions = {}) {
        if (!this.businessNetworkIdentifier) {
            throw new Error('No business network has been specified for this connection');
        }
        let identity = securityContext.getIdentity();
        let chaincodeUUID = securityContext.getChaincodeID();
        let chaincode = EmbeddedConnection.getChaincode(chaincodeUUID);
        let context = new EmbeddedContext(chaincode.engine, identity, this, chaincode.installedBusinessNetwork, additionalConnectorOptions);
        const data = await chaincode.engine.invoke(context, functionName, args);
        return !Util.isNull(data) ? Buffer.from(JSON.stringify(data)) : null;
    }

    /**
     * Get the data collection that stores identities.
     * @return {Promise} A promise that is resolved with the data collection
     * that stores identities.
     */
    async getIdentities() {
        return await this.dataService.ensureCollection('identities');
    }

    /**
     * Get the identity for the specified name.
     * @param {string} identityName The name for the identity.
     * @return {Promise} A promise that is resolved with the identity, or
     * rejected with an error.
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
     * @return {Promise} A promise that is resolved with the admin identity when complete,
     * or rejected with an error.
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
        return identity;
    }

    /**
     * Test the specified identity name and secret to ensure that it is valid.
     * admin userid doesn't require a secret.
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
                userID: identityName,
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
        return {
            userID: identityName,
            userSecret: identity.secret
        };
    }

    /**
     * Create a new transaction id
     * Note: as this is not a real fabric it returns null to let the composer-common use uuid to create one.
     * @param {SecurityContext} securityContext The participant's security context.
     * @return {Promise} A promise that is resolved with a null
     */
    async createTransactionId(securityContext) {
        return null;
    }

    /**
     * Undeploy a business network definition.
     * @param {SecurityContext} securityContext The participant's security context.
     * @param {String} networkName Name of the business network to remove
     * @async
     */
    async undeploy(securityContext, networkName) {
        await this.dataService.removeAllData();
        delete businessNetworks[networkName];
        delete chaincodes[networkName];
    }

    /**
     * Get the native API for this connection. The native API returned is specific
     * to the underlying blockchain platform, and may throw an error if there is no
     * native API available.
     */
    getNativeAPI() {
        throw new Error('native API not available when using the embedded connector');
    }

}

module.exports = EmbeddedConnection;
