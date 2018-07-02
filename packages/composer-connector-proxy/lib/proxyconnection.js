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
const ProxyUtil = require('./proxyutil');
const ProxySecurityContext = require('./proxysecuritycontext');
const Logger = require('composer-common').Logger;

const LOG = Logger.getLog('ProxyConnection');
/**
 * Base class representing a connection to a business network.
 * @protected
 * @abstract
 */
class ProxyConnection extends Connection {

    /**
     * Constructor.
     * @param {ConnectionManager} connectionManager The owning connection manager.
     * @param {string} connectionProfile The name of the connection profile associated with this connection
     * @param {string} businessNetworkIdentifier The identifier of the business network for this connection
     * @param {object} socket The connected socket.io client to use.
     * @param {string} connectionID The connection ID.
     */
    constructor(connectionManager, connectionProfile, businessNetworkIdentifier, socket, connectionID) {
        super(connectionManager, connectionProfile, businessNetworkIdentifier);
        this.socket = socket;
        this.connectionID = connectionID;
    }

    /**
     * Terminate the connection to the business network.
     * @return {Promise} A promise that is resolved once the connection has been
     * terminated, or rejected with an error.
     */
    disconnect() {
        const method = 'disconnect';
        LOG.entry(method);
        return new Promise((resolve, reject) => {
            this.socket.emit('/api/connectionDisconnect', this.connectionID, (error) => {
                if (error) {
                    return reject(ProxyUtil.inflaterr(error));
                }
                resolve();
            });
        })
        .then(() => {
            this.socket.removeListener('events', () => {});
            this.connectionManager.disconnect(this.connectionID);
            LOG.exit(method);
        });
    }

    /**
     * Login as a participant on the business network.
     * @param {string} enrollmentID The enrollment ID of the participant.
     * @param {string} enrollmentSecret The enrollment secret of the participant.
     * @return {Promise} A promise that is resolved with a {@link SecurityContext}
     * object representing the logged in participant, or rejected with a login error.
     */
    login(enrollmentID, enrollmentSecret) {
        return new Promise((resolve, reject) => {
            this.socket.emit('/api/connectionLogin', this.connectionID, enrollmentID, enrollmentSecret, (error, securityContextID) => {
                if (error) {
                    return reject(ProxyUtil.inflaterr(error));
                }
                let securityContext = new ProxySecurityContext(this, enrollmentID, securityContextID);
                resolve(securityContext);
            });
        });
    }

    /**
     * Install the Hyperledger Composer runtime.
     * @param {SecurityContext} securityContext The participant's security context.
     * @param {BusinessNetworkDefinition} networkDefinition The business network to install
     * @param {Object} installOptions connector specific install options
     * @return {Promise} A promise that is resolved once the runtime has been installed, or rejected with an error.
     */
    install(securityContext, networkDefinition, installOptions) {
        return new Promise((resolve, reject) => {
            return networkDefinition.toArchive().then(networkArchive => {
                const networkArchiveBase64 = networkArchive.toString('base64');
                this.socket.emit('/api/connectionInstall', this.connectionID, securityContext.securityContextID, networkArchiveBase64, installOptions, (error) => {
                    if (error) {
                        return reject(ProxyUtil.inflaterr(error));
                    }
                    resolve();
                });
            });
        });
    }

    /**
     * Start a business network definition.
     * @param {SecurityContext} securityContext The participant's security context.
     * @param {string} networkName The name of the business network
     * @param {string} networkVersion The version of the business network
     * @param {string} startTransaction The serialized start transaction.
     * @param {Object} startOptions connector specific installation options
     * @return {Promise} A promise that is resolved once the business network has been started,
     * or rejected with an error.
     */
    start(securityContext, networkName, networkVersion, startTransaction, startOptions) {
        return new Promise((resolve, reject) => {
            this.socket.emit('/api/connectionStart', this.connectionID, securityContext.securityContextID, networkName, networkVersion, startTransaction, startOptions, (error) => {
                if (error) {
                    return reject(ProxyUtil.inflaterr(error));
                }
                resolve();
            });
        });
    }

    /**
     * @inheritdoc
     */
    upgrade(securityContext, networkName, networkVersion, upgradeOptions) {
        return new Promise((resolve, reject) => {
            this.socket.emit('/api/connectionUpgrade', this.connectionID, securityContext.securityContextID, networkName, networkVersion, upgradeOptions, (error) => {
                if (error) {
                    return reject(ProxyUtil.inflaterr(error));
                }
                resolve();
            });
        });
    }

    /**
     * Test ("ping") the connection to the business network.
     * @param {SecurityContext} securityContext The participant's security context.
     * @return {Promise} A promise that is resolved once the connection to the
     * business network has been tested, or rejected with an error.
     */
    ping(securityContext) {
        return new Promise((resolve, reject) => {
            this.socket.emit('/api/connectionPing', this.connectionID, securityContext.securityContextID, (error, result) => {
                if (error) {
                    return reject(ProxyUtil.inflaterr(error));
                }
                resolve(result);
            });
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
        return new Promise((resolve, reject) => {
            this.socket.emit('/api/connectionQueryChainCode', this.connectionID, securityContext.securityContextID, functionName, args, (error, result) => {
                if (error) {
                    return reject(ProxyUtil.inflaterr(error));
                } else if (result) {
                    resolve(Buffer.from(result));
                } else {
                    resolve(null);
                }
            });
        });
    }

    /**
     * Invoke a "invoke" chaincode function with the specified name and arguments.
     * @param {SecurityContext} securityContext The participant's security context.
     * @param {string} functionName The name of the chaincode function to invoke.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @param {Object} options options to pass to invoking chaincode
     * @param {Object} options.transactionId Transaction Id to use.
     * @return {Promise} A promise that is resolved with the data returned by the
     * chaincode function once it has been invoked, or rejected with an error.
     */
    invokeChainCode(securityContext, functionName, args, options) {
        return new Promise((resolve, reject) => {
            this.socket.emit('/api/connectionInvokeChainCode', this.connectionID, securityContext.securityContextID, functionName, args, options, (error, result) => {
                if (error) {
                    return reject(ProxyUtil.inflaterr(error));
                } else if (result) {
                    resolve(Buffer.from(result));
                } else {
                    resolve(null);
                }
            });
        });
    }

    /**
     * Create a new identity for the specified user ID.
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
    createIdentity(securityContext, userID, options) {
        return new Promise((resolve, reject) => {
            this.socket.emit('/api/connectionCreateIdentity', this.connectionID, securityContext.securityContextID, userID, options, (error, result) => {
                if (error) {
                    return reject(ProxyUtil.inflaterr(error));
                }
                resolve(result);
            });
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
        return new Promise((resolve, reject) => {
            this.socket.emit('/api/connectionList', this.connectionID, securityContext.securityContextID, (error, result) => {
                if (error) {
                    return reject(ProxyUtil.inflaterr(error));
                }
                resolve(result);
            });
        });
    }

    /**
     * Create a new transaction id
     * @param {SecurityContext} securityContext The participant's security context.
     * @return {Promise} A promise that is resolved with a generated user
     * secret once the new identity has been created, or rejected with an error.
     */
    createTransactionId(securityContext){
        return new Promise((resolve, reject) => {
            this.socket.emit('/api/connectionCreateTransactionId', this.connectionID, securityContext.securityContextID, (error, result) => {
                if (error) {
                    return reject(ProxyUtil.inflaterr(error));
                }
                resolve(result);
            });
        });
    }

    /**
     * Get the native API for this connection. The native API returned is specific
     * to the underlying blockchain platform, and may throw an error if there is no
     * native API available.
     */
    getNativeAPI() {
        throw new Error('native API not available when using the proxy connector');
    }

}

module.exports = ProxyConnection;
