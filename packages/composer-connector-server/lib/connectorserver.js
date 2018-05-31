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
const IdCard = require('composer-common').IdCard;
const BusinessNetworkDefinition = require('composer-common').BusinessNetworkDefinition;
const Logger = require('composer-common').Logger;
const realSerializerr = require('serializerr');
const uuid = require('uuid');
const version = require('../package.json').version;

const LOG = Logger.getLog('ConnectorServer');

/**
 * A connector server for hosting Composer connectors and
 * serving them over a connected socket.io socket.
 */
class ConnectorServer {

    /**
     * A wrapper around serializerr that checks for non-error objects
     * like strings that are sometimes incorrectly returned by hfc.
     * @param {Error} error The error to serialize with serializerr.
     * @return {Object} The error serialized by serializerr.
     */
    static serializerr (error) {
        if (error instanceof Error) {
            return realSerializerr(error);
        } else {
            return realSerializerr(new Error(error.toString()));
        }
    }

    /**
     * Get the type of connection from the connection profile stripping off any routing connection
     * information that could have routed the connection request (ie xyz@proxy)
     * @param {object} connectionProfile the connection profile
     * @returns {string} the appropriate connection type to use
     */
    static getConnectionType(connectionProfile) {
        let type = connectionProfile['x-type'].trim();
        let index = type.toLowerCase().lastIndexOf('@');
        return index === -1 ? type : type.substring(0, index);
    }

    /**
     * Constructor.
     * @param {BusinessNetworkCardStore} businessNetworkCardStore The business network card store to use.
     * @param {ConnectionProfileManager} connectionProfileManager The connection profile manager to use.
     * @param {Socket} socket The connected socket to use for communicating with the client.
     */
    constructor (businessNetworkCardStore, connectionProfileManager, socket) {
        const method = 'constructor';
        LOG.entry(method, businessNetworkCardStore, connectionProfileManager, socket);
        this.businessNetworkCardStore = businessNetworkCardStore;
        this.connectionProfileManager = connectionProfileManager;
        this.socket = socket;
        let propertyNames = Object.getOwnPropertyNames(Object.getPrototypeOf(this)).sort();
        propertyNames.forEach((propertyName) => {
            if (propertyName === 'constructor') {
                return Promise.resolve();
            }
            let property = this[propertyName];
            if (typeof property === 'function') {
                this.socket.on(`/api/${propertyName}`, this[propertyName].bind(this));
            }
        });
        this.connections = {};
        this.securityContexts = {};
        LOG.exit(method);
    }

    /**
     * Test the connection to the connector server.
     * @param {function} callback The callback to call when complete.
     */
    async ping(callback) {
        callback(null, { version });
    }

    /**
     * Handle a request from the client to get a busines network card.
     * @param {string} cardName The name of the card.
     * @param {function} callback The callback to call when complete.
     * @return {Promise} A promise that is resolved when complete.
     */
    businessNetworkCardStoreGet (cardName, callback) {
        const method = 'businessNetworkCardStoreGet';
        LOG.entry(method, cardName);
        return this.businessNetworkCardStore.get(cardName)
            .then((result) => {
                callback(null, result);
                LOG.exit(method, result);
            })
            .catch((error) => {
                LOG.error(method, error);
                callback(ConnectorServer.serializerr(error));
                LOG.exit(method, null);
            });
    }

    /**
     * Handle a request from the client to has a busines network card.
     * @param {string} cardName The name of the card.
     * @param {function} callback The callback to call when complete.
     * @return {Promise} A promise that is resolved when complete.
     */
    businessNetworkCardStoreHas (cardName, callback) {
        const method = 'businessNetworkCardStoreHas';
        LOG.entry(method, cardName);
        return this.businessNetworkCardStore.has(cardName)
            .then((result) => {
                callback(null, result);
                LOG.exit(method, result);
            })
            .catch((error) => {
                LOG.error(method, error);
                callback(ConnectorServer.serializerr(error));
                LOG.exit(method, null);
            });
    }

    /**
     * Handle a request from the client to get a busines network card.
     * @param {string} cardName The name of the card.
     * @param {object} cardProperties The card.
     * @param {function} callback The callback to call when complete.
     * @return {Promise} A promise that is resolved when complete.
     */
    businessNetworkCardStorePut (cardName, cardProperties, callback) {
        const method = 'businessNetworkCardStorePut';
        LOG.entry(method, cardName, cardProperties);
        let card = new IdCard(cardProperties.metadata, cardProperties.connectionProfile);
        card.setCredentials(cardProperties.credentials);
        return this.businessNetworkCardStore.put(cardName, card)
            .then((result) => {
                callback(null, result);
                LOG.exit(method, result);
            })
            .catch((error) => {
                LOG.error(method, error);
                callback(ConnectorServer.serializerr(error));
                LOG.exit(method, null);
            });
    }

    /**
     * Handle a request from the client to get a busines network card.
     * @param {function} callback The callback to call when complete.
     * @return {Promise} A promise that is resolved when complete.
     */
    businessNetworkCardStoreGetAll (callback) {
        const method = 'businessNetworkCardStoreGetAll';
        LOG.entry(method);
        return this.businessNetworkCardStore.getAll()
            .then((result) => {
                let resultObject = {};
                result.forEach((card, cardName) => {
                    resultObject[cardName] = card;
                });
                callback(null, resultObject);
                LOG.exit(method, result);
            })
            .catch((error) => {
                LOG.error(method, error);
                callback(ConnectorServer.serializerr(error));
                LOG.exit(method, null);
            });
    }

    /**
     * Handle a request from the client to get a busines network card.
     * @param {string} cardName The name of the card.
     * @param {function} callback The callback to call when complete.
     * @return {Promise} A promise that is resolved when complete.
     */
    businessNetworkCardStoreDelete (cardName, callback) {
        const method = 'businessNetworkCardStorePut';
        LOG.entry(method, cardName);
        return this.businessNetworkCardStore.delete(cardName)
            .then((result) => {
                callback(null, result);
                LOG.exit(method, result);
            })
            .catch((error) => {
                LOG.error(method, error);
                callback(ConnectorServer.serializerr(error));
                LOG.exit(method, null);
            });
    }

    /**
     * Handle a request from the client to import an identity.
     * @param {string} connectionProfile The name of the connection profile
     * @param {object} connectionOptions The connection options loaded from the profile
     * @param {string} id the id to associate with the identity
     * @param {string} certificate the certificate
     * @param {string} privateKey the private key
     * @param {function} callback The callback to call when complete.
     * @return {Promise} A promise that is resolved when complete.
     */
    async connectionManagerImportIdentity (connectionProfile, connectionOptions, id, certificate, privateKey, callback) {
        const method = 'connectionManagerImportIdentity';
        LOG.entry(method, connectionProfile, id, certificate, privateKey);
        connectionOptions.wallet = await this.businessNetworkCardStore.getWallet(connectionOptions.cardName);
        return this.connectionProfileManager.getConnectionManagerByType(ConnectorServer.getConnectionType(connectionOptions))
            .then((connectionManager) => {
                return connectionManager.importIdentity(connectionProfile, connectionOptions, id, certificate, privateKey);
            })
            .then(() => {
                callback(null);
                LOG.exit(method);
            })
            .catch((error) => {
                LOG.error(method, error);
                callback(ConnectorServer.serializerr(error));
                LOG.exit(method, null);
            });
    }

    /**
     * Handle a request from the client to remove an identity.
     * @param {string} connectionProfile The name of the connection profile
     * @param {object} connectionOptions The connection options loaded from the profile
     * @param {string} id the id to associate with the identity
     * @param {function} callback The callback to call when complete.
     */
    async connectionManagerRemoveIdentity(connectionProfile, connectionOptions, id, callback) {
        const method = 'connectionManagerRemoveIdentity';
        LOG.entry(method, connectionProfile, id);
        try {
            connectionOptions.wallet = await this.businessNetworkCardStore.getWallet(connectionOptions.cardName);
            const connectionManager = await this.connectionProfileManager.getConnectionManagerByType(ConnectorServer.getConnectionType(connectionOptions));
            const deleted = await connectionManager.removeIdentity(connectionProfile, connectionOptions, id);
            callback(null, deleted);
            LOG.exit(method);
        } catch (error) {
            LOG.error(method, error);
            callback(ConnectorServer.serializerr(error));
            LOG.exit(method, null);
        }
    }


    /**
     * Obtain the credentials associated with a given identity.
     * @param {String} connectionProfileName - Name of the connection profile.
     * @param {Object} connectionOptions - connection options loaded from the profile.
     * @param {String} id - Name of the identity.
     * @param {function} callback The callback to call when complete.
     * @return {Promise} Promise that resolves to credentials.
     */
    async connectionManagerExportIdentity (connectionProfileName, connectionOptions, id, callback) {
        const method = 'connectionManagerExportIdentity';
        LOG.entry(method, connectionProfileName, connectionOptions, id);
        connectionOptions.wallet = await this.businessNetworkCardStore.getWallet(connectionOptions.cardName);
        return this.connectionProfileManager.getConnectionManagerByType(ConnectorServer.getConnectionType(connectionOptions))
            .then((connectionManager) => {
                return connectionManager.exportIdentity(connectionProfileName, connectionOptions, id);
            })
            .then((credentials) => {
                callback(null, credentials);
                LOG.exit(method, credentials);
            })
            .catch((error) => {
                LOG.error(method, error);
                callback(ConnectorServer.serializerr(error));
                LOG.exit(method, null);
            });
    }

    /**
     * Handle a request from the client to connect to a business network.
     * @param {string} connectionProfile The connection profile name.
     * @param {string} businessNetworkIdentifier The business network identifier.
     * @param {Object} connectionOptions The connection profile options to use.
     * @param {function} callback The callback to call when complete.
     */
    async connectionManagerConnect (connectionProfile, businessNetworkIdentifier, connectionOptions, callback) {
        const method = 'connectionManagerConnect';
        LOG.entry(method, connectionProfile, businessNetworkIdentifier, connectionOptions);
        try {
            connectionOptions.wallet = await this.businessNetworkCardStore.getWallet(connectionOptions.cardName);
            let connectionManager = await this.connectionProfileManager.getConnectionManagerByType(ConnectorServer.getConnectionType(connectionOptions));

            // don't have to worry about changing the connectionOptions for x-type as that information is not processed
            // by an connector connect call or by the connectors themselves. x-type is purely for use by the connectionprofilemanager
            const connection = await connectionManager.connect(connectionProfile, businessNetworkIdentifier, connectionOptions);
            const connectionID = uuid.v4();
            this.connections[connectionID] = connection;
            callback(null, connectionID);
            LOG.exit(method, connectionID);
        } catch (error) {
            LOG.error(method, error);
            callback(ConnectorServer.serializerr(error));
            LOG.exit(method, null);
        }
    }

    /**
     * Handle a request from the client to disconnect from a business network.
     * @param {string} connectionID The connection ID.
     * @param {function} callback The callback to call when complete.
     * @return {Promise} A promise that is resolved when complete.
     */
    connectionDisconnect (connectionID, callback) {
        const method = 'connectionDisconnect';
        LOG.entry(method, connectionID);
        let connection = this.connections[connectionID];
        if (!connection) {
            let error = new Error(`No connection found with ID ${connectionID}`);
            LOG.error(method, error);
            callback(ConnectorServer.serializerr(error));
            LOG.exit(method, null);
            return Promise.resolve();
        }
        delete this.connections[connectionID];

        connection.removeListener('events', () => {
        });

        return connection.disconnect()
            .then(() => {
                callback(null);
                LOG.exit(method);
            })
            .catch((error) => {
                LOG.error(method, error);
                callback(ConnectorServer.serializerr(error));
                LOG.exit(method);
            });
    }

    /**
     * Handle a request from the client to login to a business network.
     * @param {string} connectionID The connection ID.
     * @param {string} enrollmentID The enrollment ID.
     * @param {string} enrollmentSecret The enrollment secret.
     * @param {function} callback The callback to call when complete.
     * @return {Promise} A promise that is resolved when complete.
     */
    connectionLogin (connectionID, enrollmentID, enrollmentSecret, callback) {
        const method = 'connectionLogin';
        LOG.entry(method, connectionID, enrollmentID, enrollmentSecret);
        let connection = this.connections[connectionID];
        if (!connection) {
            let error = new Error(`No connection found with ID ${connectionID}`);
            LOG.error(method, error);
            callback(ConnectorServer.serializerr(error));
            LOG.exit(method, null);
            return Promise.resolve();
        }
        return connection.login(enrollmentID, enrollmentSecret)
            .then((securityContext) => {
                let securityContextID = uuid.v4();
                this.securityContexts[securityContextID] = securityContext;
                callback(null, securityContextID);
                LOG.exit(method, securityContextID);
            })
            .then(() => {
                connection.on('events', (events) => {
                    LOG.debug(method, events);
                    this.socket.emit('events', connectionID, events);
                });
            })
            .catch((error) => {
                LOG.error(method, error);
                callback(ConnectorServer.serializerr(error));
                LOG.exit(method);
            });
    }

    /**
     * Handle a request from the client to install the runtime.
     * @param {string} connectionID The connection ID.
     * @param {string} securityContextID The security context ID.
     * @param {string} networkArchiveBase64 Base64 encoded business network archive
     * @param {Object} installOptions connector specific install options
     * @param {function} callback The callback to call when complete.
     * @return {Promise} A promise that is resolved when complete.
     */
    connectionInstall (connectionID, securityContextID, networkArchiveBase64, installOptions, callback) {
        const method = 'connectionDeploy';
        LOG.entry(method, connectionID, securityContextID, networkArchiveBase64, installOptions);
        let connection = this.connections[connectionID];
        if (!connection) {
            let error = new Error(`No connection found with ID ${connectionID}`);
            LOG.error(method, error);
            callback(ConnectorServer.serializerr(error));
            LOG.exit(method, null);
            return Promise.resolve();
        }
        let securityContext = this.securityContexts[securityContextID];
        if (!securityContext) {
            let error = new Error(`No security context found with ID ${securityContextID}`);
            LOG.error(method, error);
            callback(ConnectorServer.serializerr(error));
            LOG.exit(method, null);
            return Promise.resolve();
        }

        if (process.env.NPMRC_FILE) {
            if (!installOptions) {
                installOptions = {
                    npmrcFile: process.env.NPMRC_FILE
                };
            } else if (!installOptions.npmrcFile) {
                installOptions.npmrcFile = process.env.NPMRC_FILE;
            }
        }

        const networkArchiveBuffer = Buffer.from(networkArchiveBase64, 'base64');
        return BusinessNetworkDefinition.fromArchive(networkArchiveBuffer)
            .then(networkDefinition => {
                return connection.install(securityContext, networkDefinition, installOptions);
            }).then(() => {
                callback(null);
                LOG.exit(method);
            })
            .catch((error) => {
                LOG.error(method, error);
                callback(ConnectorServer.serializerr(error));
                LOG.exit(method);
            });
    }

    /**
     * Handle a request from the client to start a business network.
     * @param {string} connectionID The connection ID.
     * @param {string} securityContextID The security context ID.
     * @param {string} networkName The identifier of the business network that will be started
     * @param {string} networkVersion The version of the business network that will be started
     * @param {string} startTransaction The serialized start transaction.
     * @param {Object} startOptions connector specific installation options.
     * @param {function} callback The callback to call when complete.
     * @return {Promise} A promise that is resolved when complete.
     */
    connectionStart(connectionID, securityContextID, networkName, networkVersion, startTransaction, startOptions, callback) {
        const method = 'connectionStart';
        LOG.entry(method, connectionID, securityContextID, networkName, networkVersion, startTransaction, startOptions);
        let connection = this.connections[connectionID];
        if (!connection) {
            let error = new Error(`No connection found with ID ${connectionID}`);
            LOG.error(method, error);
            callback(ConnectorServer.serializerr(error));
            LOG.exit(method, null);
            return Promise.resolve();
        }
        let securityContext = this.securityContexts[securityContextID];
        if (!securityContext) {
            let error = new Error(`No security context found with ID ${securityContextID}`);
            LOG.error(method, error);
            callback(ConnectorServer.serializerr(error));
            LOG.exit(method, null);
            return Promise.resolve();
        }
        return connection.start(securityContext, networkName, networkVersion, startTransaction, startOptions)
            .then(() => {
                callback(null);
                LOG.exit(method);
            })
            .catch((error) => {
                LOG.error(method, error);
                callback(ConnectorServer.serializerr(error));
                LOG.exit(method);
            });
    }

    /**
     * Handle a request from the client to upgrade a business network.
     * @param {string} connectionID The connection ID.
     * @param {string} securityContextID The security context ID.
     * @param {string} networkName The identifier of the business network that will be upgraded
     * @param {string} networkVersion The version to which the business network will be upgraded
     * @param {Object} upgradeOptions connector specific installation options.
     * @param {function} callback The callback to call when complete.
     * @return {Promise} A promise that is resolved when complete.
     */
    connectionUpgrade(connectionID, securityContextID, networkName, networkVersion, upgradeOptions, callback) {
        const method = 'connectionUpgrade';
        LOG.entry(method, connectionID, securityContextID, networkName, networkVersion, upgradeOptions);
        let connection = this.connections[connectionID];
        if (!connection) {
            let error = new Error(`No connection found with ID ${connectionID}`);
            LOG.error(method, error);
            callback(ConnectorServer.serializerr(error));
            LOG.exit(method, null);
            return Promise.resolve();
        }
        let securityContext = this.securityContexts[securityContextID];
        if (!securityContext) {
            let error = new Error(`No security context found with ID ${securityContextID}`);
            LOG.error(method, error);
            callback(ConnectorServer.serializerr(error));
            LOG.exit(method, null);
            return Promise.resolve();
        }
        return connection.upgrade(securityContext, networkName, networkVersion, upgradeOptions)
            .then(() => {
                callback(null);
                LOG.exit(method);
            })
            .catch((error) => {
                LOG.error(method, error);
                callback(ConnectorServer.serializerr(error));
                LOG.exit(method);
            });
    }

    /**
     * Handle a request from the client to test the connection to the business network.
     * @param {string} connectionID The connection ID.
     * @param {string} securityContextID The security context ID.
     * @param {function} callback The callback to call when complete.
     * @return {Promise} A promise that is resolved when complete.
     */
    connectionPing (connectionID, securityContextID, callback) {
        const method = 'connectionPing';
        LOG.entry(method, connectionID, securityContextID);
        let connection = this.connections[connectionID];
        if (!connection) {
            let error = new Error(`No connection found with ID ${connectionID}`);
            LOG.error(method, error);
            callback(ConnectorServer.serializerr(error));
            LOG.exit(method, null);
            return Promise.resolve();
        }
        let securityContext = this.securityContexts[securityContextID];
        if (!securityContext) {
            let error = new Error(`No security context found with ID ${securityContextID}`);
            LOG.error(method, error);
            callback(ConnectorServer.serializerr(error));
            LOG.exit(method, null);
            return Promise.resolve();
        }
        return connection.ping(securityContext)
            .then((result) => {
                callback(null, result);
                LOG.exit(method, result);
            })
            .catch((error) => {
                LOG.error(method, error);
                callback(ConnectorServer.serializerr(error));
                LOG.exit(method);
            });
    }

    /**
     * Handle a request from the client to issue a query request to the business network.
     * @param {string} connectionID The connection ID.
     * @param {string} securityContextID The security context ID.
     * @param {string} functionName The runtime function to call.
     * @param {string[]} args The arguments to pass to the runtime function.
     * @param {function} callback The callback to call when complete.
     * @return {Promise} A promise that is resolved when complete.
     */
    connectionQueryChainCode (connectionID, securityContextID, functionName, args, callback) {
        const method = 'connectionQueryChainCode';
        LOG.entry(method, connectionID, securityContextID, functionName, args);
        let connection = this.connections[connectionID];
        if (!connection) {
            let error = new Error(`No connection found with ID ${connectionID}`);
            LOG.error(method, error);
            callback(ConnectorServer.serializerr(error));
            LOG.exit(method, null);
            return Promise.resolve();
        }
        let securityContext = this.securityContexts[securityContextID];
        if (!securityContext) {
            let error = new Error(`No security context found with ID ${securityContextID}`);
            LOG.error(method, error);
            callback(ConnectorServer.serializerr(error));
            LOG.exit(method, null);
            return Promise.resolve();
        }
        return connection.queryChainCode(securityContext, functionName, args)
            .then((result) => {
                callback(null, result.toString());
                LOG.exit(method, result.toString());
            })
            .catch((error) => {
                LOG.error(method, error);
                callback(ConnectorServer.serializerr(error));
                LOG.exit(method, null);
            });
    }

    /**
     * Handle a request from the client to issue an invoke request to the business network.
     * @param {string} connectionID The connection ID.
     * @param {string} securityContextID The security context ID.
     * @param {string} functionName The runtime function to call.
     * @param {string[]} args The arguments to pass to the runtime function.
     * @param {Object} options options to pass to invoking chaincode
     * @param {Object} options.transactionId Transaction Id to use.
     * @param {function} callback The callback to call when complete.
     * @return {Promise} A promise that is resolved when complete.
     */
    connectionInvokeChainCode(connectionID, securityContextID, functionName, args, options, callback) {
        const method = 'connectionInvokeChainCode';
        LOG.entry(method, connectionID, securityContextID, functionName, args);
        let connection = this.connections[connectionID];
        if (!connection) {
            let error = new Error(`No connection found with ID ${connectionID}`);
            LOG.error(method, error);
            callback(ConnectorServer.serializerr(error));
            LOG.exit(method, null);
            return Promise.resolve();
        }
        let securityContext = this.securityContexts[securityContextID];
        if (!securityContext) {
            let error = new Error(`No security context found with ID ${securityContextID}`);
            LOG.error(method, error);
            callback(ConnectorServer.serializerr(error));
            LOG.exit(method, null);
            return Promise.resolve();
        }
        return connection.invokeChainCode(securityContext, functionName, args, options)
            .then(() => {
                callback(null);
                LOG.exit(method);
            })
            .catch((error) => {
                LOG.error(method, error);
                callback(ConnectorServer.serializerr(error));
                LOG.exit(method);
            });
    }

    /**
     * Handle a request from the client to create an identity for a participant in the business network.
     * @param {string} connectionID The connection ID.
     * @param {string} securityContextID The security context ID.
     * @param {string} userID The user ID of the new identity.
     * @param {Object} options The options to use to create the new identity.
     * @param {function} callback The callback to call when complete.
     * @return {Promise} A promise that is resolved when complete.
     */
    connectionCreateIdentity (connectionID, securityContextID, userID, options, callback) {
        const method = 'connectionCreateIdentity';
        LOG.entry(method, connectionID, securityContextID, userID, options);
        let connection = this.connections[connectionID];
        if (!connection) {
            let error = new Error(`No connection found with ID ${connectionID}`);
            LOG.error(method, error);
            callback(ConnectorServer.serializerr(error));
            LOG.exit(method, null);
            return Promise.resolve();
        }
        let securityContext = this.securityContexts[securityContextID];
        if (!securityContext) {
            let error = new Error(`No security context found with ID ${securityContextID}`);
            LOG.error(method, error);
            callback(ConnectorServer.serializerr(error));
            LOG.exit(method, null);
            return Promise.resolve();
        }
        return connection.createIdentity(securityContext, userID, options)
            .then((result) => {
                callback(null, result);
                LOG.exit(method, result);
            })
            .catch((error) => {
                LOG.error(method, error);
                callback(ConnectorServer.serializerr(error));
                LOG.exit(method, null);
            });
    }

    /**
     * Handle a request from the client to list all deployed business networks.
     * @param {string} connectionID The connection ID.
     * @param {string} securityContextID The security context ID.
     * @param {function} callback The callback to call when complete.
     * @return {Promise} A promise that is resolved when complete.
     */
    connectionList (connectionID, securityContextID, callback) {
        const method = 'connectionList';
        LOG.entry(method, connectionID, securityContextID);
        let connection = this.connections[connectionID];
        if (!connection) {
            let error = new Error(`No connection found with ID ${connectionID}`);
            LOG.error(method, error);
            callback(ConnectorServer.serializerr(error));
            LOG.exit(method, null);
            return Promise.resolve();
        }
        let securityContext = this.securityContexts[securityContextID];
        if (!securityContext) {
            let error = new Error(`No security context found with ID ${securityContextID}`);
            LOG.error(method, error);
            callback(ConnectorServer.serializerr(error));
            LOG.exit(method, null);
            return Promise.resolve();
        }
        return connection.list(securityContext)
            .then((result) => {
                callback(null, result);
                LOG.exit(method, result);
            })
            .catch((error) => {
                LOG.error(method, error);
                callback(ConnectorServer.serializerr(error));
                LOG.exit(method, null);
            });
    }

    /**
     * Handle a request from the client to create a transaction id
     * @param {string} connectionID The connection ID.
     * @param {string} securityContextID The security context ID.
     * @param {function} callback The callback to call when complete.
     * @return {Promise} A promise that is resolved when complete.
     */
    connectionCreateTransactionId (connectionID, securityContextID, callback) {
        const method = 'connectionCreateTransactionId';
        LOG.entry(method, connectionID, securityContextID);
        let connection = this.connections[connectionID];
        if (!connection) {
            let error = new Error(`No connection found with ID ${connectionID}`);
            LOG.error(method, error);
            callback(ConnectorServer.serializerr(error));
            LOG.exit(method, null);
            return Promise.resolve();
        }
        let securityContext = this.securityContexts[securityContextID];
        if (!securityContext) {
            let error = new Error(`No security context found with ID ${securityContextID}`);
            LOG.error(method, error);
            callback(ConnectorServer.serializerr(error));
            LOG.exit(method, null);
            return Promise.resolve();
        }
        return connection.createTransactionId(securityContext)
            .then((result) => {
                callback(null, result);
                LOG.exit(method, result);
            })
            .catch((error) => {
                LOG.error(method, error);
                callback(ConnectorServer.serializerr(error));
                LOG.exit(method, null);
            });
    }
}

module.exports = ConnectorServer;
