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
const createHash = require('sha.js');
const Engine = require('composer-runtime').Engine;
const EmbeddedContainer = require('composer-runtime-embedded').EmbeddedContainer;
const EmbeddedContext = require('composer-runtime-embedded').EmbeddedContext;
const EmbeddedDataService = require('composer-runtime-embedded').EmbeddedDataService;
const EmbeddedSecurityContext = require('./embeddedsecuritycontext');
const uuid = require('uuid');

// A mapping of business networks to chaincode IDs.
const businessNetworks = {};

// A mapping of chaincode IDs to their instance objects.
const chaincodes = {};

// The issuer for all identities.
const DEFAULT_ISSUER = createHash('sha256').update('org1').digest('hex');

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
        this.dataService = new EmbeddedDataService(null, true);
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
        if (!this.businessNetworkIdentifier) {
            return this.testIdentity(enrollmentID, enrollmentSecret)
                .then((identity) => {
                    return new EmbeddedSecurityContext(this, identity);
                });
        }
        return this.testIdentity(enrollmentID, enrollmentSecret)
            .then((identity) => {
                let chaincodeUUID = EmbeddedConnection.getBusinessNetwork(this.businessNetworkIdentifier, this.connectionProfile);
                if (!chaincodeUUID) {
                    throw new Error(`No chaincode ID found for business network '${this.businessNetworkIdentifier}'`);
                }

                const result = new EmbeddedSecurityContext(this, identity);
                result.setChaincodeID(chaincodeUUID);
                return result;
            });
    }

    /**
     * For the embedded connector, this is just a no-op, there is nothing to install.
     * @param {SecurityContext} securityContext The participant's security context.
     * @param {string} businessNetworkIdentifier The identifier of the Business network that will be started in this installed runtime
     * @param {Object} installOptions connector specific installation options
     * @return {Promise} A resolved promise as this is a no-op
     */
    install(securityContext, businessNetworkIdentifier, installOptions) {
        return Promise.resolve();
    }

    /**
     * Deploy a business network. For the embedded connector this just translates to
     * a start request as no install is required.
     * @param {HFCSecurityContext} securityContext The participant's security context.
     * @param {string} businessNetworkIdentifier The identifier of the Business network that will be started in this installed runtime
     * @param {string} deployTransaction The serialized deploy transaction.
     * @param {Object} deployOptions connector specific deploy options
     * @return {Promise} A promise that is resolved once the business network
     * artefacts have been deployed, or rejected with an error.
     */
    deploy(securityContext, businessNetworkIdentifier, deployTransaction, deployOptions) {
        return this.start(securityContext, businessNetworkIdentifier, deployTransaction, deployOptions);
    }

    /**
     * Start a business network.
     * @param {HFCSecurityContext} securityContext The participant's security context.
     * @param {string} businessNetworkIdentifier The identifier of the Business network that will be started in this installed runtime
     * @param {string} startTransaction The serialized start transaction.
     * @param {Object} startOptions connector specific start options
     * @return {Promise} A promise that is resolved once the business network
     * artefacts have been deployed and started, or rejected with an error.
     */
    start(securityContext, businessNetworkIdentifier, startTransaction, startOptions) {
        let container = EmbeddedConnection.createContainer();
        let identity = securityContext.getIdentity();
        let chaincodeUUID = container.getUUID();
        let engine = EmbeddedConnection.createEngine(container);
        EmbeddedConnection.addBusinessNetwork(businessNetworkIdentifier, this.connectionProfile, chaincodeUUID);
        EmbeddedConnection.addChaincode(chaincodeUUID, container, engine);
        let context = new EmbeddedContext(engine, identity, this);
        return engine.init(context, 'init', [startTransaction]);
    }

    /**
     * Undeploy a business network definition.
     * @abstract
     * @param {SecurityContext} securityContext The participant's security context.
     * @param {string} businessNetworkIdentifier The identifier of the business network to remove
     * @return {Promise} A promise that is resolved once the business network
     * artefacts have been undeployed, or rejected with an error.
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

        let identity = securityContext.getIdentity();
        let chaincodeUUID = securityContext.getChaincodeID();
        let chaincode = EmbeddedConnection.getChaincode(chaincodeUUID);
        let context = new EmbeddedContext(chaincode.engine, identity, this);
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
        let identity = securityContext.getIdentity();
        let chaincodeUUID = securityContext.getChaincodeID();
        let chaincode = EmbeddedConnection.getChaincode(chaincodeUUID);
        let context = new EmbeddedContext(chaincode.engine, identity, this);
        return chaincode.engine.invoke(context, functionName, args)
            .then((data) => {
                return undefined;
            });
    }

    /**
     * Get the data collection that stores identities.
     * @return {Promise} A promise that is resolved with the data collection
     * that stores identities.
     */
    getIdentities() {
        return this.dataService.ensureCollection('identities');
    }

    /**
     * Get the identity for the specified name.
     * @param {string} identityName The name for the identity.
     * @return {Promise} A promise that is resolved with the identity, or
     * rejected with an error.
     */
    getIdentity(identityName) {
        let identities;
        return this.getIdentities()
            .then((identities_) => {
                identities = identities_;
                return identities.get(identityName);
            })
            .catch((error) => {
                if (identityName === 'admin') {
                    return this._createAdminIdentity();
                }
                throw error;
            });
    }

    /**
     * Create the default admin identity.
     * @return {Promise} A promise that is resolved with the admin identity when complete,
     * or rejected with an error.
     */
    _createAdminIdentity() {
        const identityName = 'admin';
        const certificateContents = identityName;
        const certificate = [
            '-----BEGIN CERTIFICATE-----',
            Buffer.from(certificateContents).toString('base64'),
            '-----END CERTIFICATE-----'
        ].join('\n').concat('\n');
        const identifier = createHash('sha256').update(certificateContents).digest('hex');
        const identity = {
            identifier,
            name: identityName,
            issuer: DEFAULT_ISSUER,
            secret: 'adminpw',
            certificate,
            imported: false,
            options: {
                issuer: true
            }
        };
        let identities;
        return this.getIdentities()
            .then((identities_) => {
                identities = identities_;
                return identities.add(identityName, identity);
            })
            .then(() => {
                return identities.add(identifier, identity);
            })
            .then(() => {
                return identity;
            });
    }

    /**
     * Test the specified identity name and secret to ensure that it is valid.
     * @param {string} identityName The name for the identity.
     * @param {string} identitySecret The secret for the identity.
     * @return {Promise} A promise that is resolved if the user ID and secret
     * is valid, or rejected with an error.
     */
    testIdentity(identityName, identitySecret) {
        return this.getIdentity(identityName)
            .then((identity) => {
                if (identity.imported) {
                    return identity;
                } else if (identityName === 'admin') {
                    return identity;
                } else if (identity.secret !== identitySecret) {
                    throw new Error(`The secret ${identitySecret} specified for the identity ${identityName} does not match the stored secret ${identity.secret}`);
                } else {
                    return identity;
                }
            });
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
    createIdentity(securityContext, identityName, options) {
        let identities;
        const currentIdentity = securityContext.getIdentity();
        if (!currentIdentity.options.issuer) {
            throw new Error(`The identity ${currentIdentity.name} does not have permission to create a new identity ${identityName}`);
        }
        return this.getIdentities()
            .then((identities_) => {
                identities = identities_;
                return identities.exists(identityName);
            })
            .then((exists) => {
                if (exists) {
                    return identities.get(identityName)
                        .then((identity) => {
                            return {
                                userID: identity.name,
                                userSecret: identity.secret
                            };
                        });
                }
                const certificateContents = identityName + ':' + uuid.v4();
                const certificate = [
                    '-----BEGIN CERTIFICATE-----',
                    Buffer.from(certificateContents).toString('base64'),
                    '-----END CERTIFICATE-----'
                ].join('\n').concat('\n');
                const identifier = createHash('sha256').update(certificateContents).digest('hex');
                const secret = uuid.v4().substring(0, 8);
                const identity = {
                    identifier,
                    name: identityName,
                    issuer: DEFAULT_ISSUER,
                    secret,
                    certificate,
                    imported: false,
                    options: options || {}
                };
                return identities.add(identityName, identity)
                    .then(() => {
                        return identities.add(identifier, identity);
                    })
                    .then(() => {
                        return {
                            userID: identity.name,
                            userSecret: identity.secret
                        };
                    });
            });
    }


    /**
     * Create a new transaction id
     * Note: as this is not a real fabric it returns null to let the composer-common use uuid to create one.
     * @param {SecurityContext} securityContext The participant's security context.
     * @return {Promise} A promise that is resolved with a generated user
     * secret once the new identity has been created, or rejected with an error.
     */
    createTransactionId(securityContext){
        return Promise.resolve(null);
    }
}

module.exports = EmbeddedConnection;
