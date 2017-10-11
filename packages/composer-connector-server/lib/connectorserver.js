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

const BusinessNetworkDefinition = require('composer-common').BusinessNetworkDefinition;
const Logger = require('composer-common').Logger;
const realSerializerr = require('serializerr');
const uuid = require('uuid');

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
    static serializerr(error) {
        if (error instanceof Error) {
            return realSerializerr(error);
        } else {
            return realSerializerr(new Error(error.toString()));
        }
    }

    /**
     * Constructor.
     * @param {ConnectionProfileStore} connectionProfileStore The connection profile store to use.
     * @param {ConnectionProfileManager} connectionProfileManager The connection profile manager to use.
     * @param {Socket} socket The connected socket to use for communicating with the client.
     */
    constructor(connectionProfileStore, connectionProfileManager, socket) {
        const method = 'constructor';
        LOG.entry(method, connectionProfileStore, connectionProfileManager, socket);
        this.connectionProfileStore = connectionProfileStore;
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
     * Handle a request from the client to load a connection profile.
     * @param {string} connectionProfile The name of the connection profile
     * @param {function} callback The callback to call when complete.
     * @return {Promise} A promise that is resolved when complete.
     */
    connectionProfileStoreLoad(connectionProfile, callback) {
        const method = 'connectionProfileStoreLoad';
        LOG.entry(method, connectionProfile);
        return this.connectionProfileStore.load(connectionProfile)
            .then((result) => {
                callback(null, result);
                LOG.exit(method, result);
            })
            .catch((error) => {
                LOG.error(error);
                callback(ConnectorServer.serializerr(error));
                LOG.exit(method, null);
            });
    }

    /**
     * Handle a request from the client to save a connection profile.
     * @param {string} connectionProfile The name of the connection profile
     * @param {object} connectionOptions The connection options loaded from the profile
     * @param {function} callback The callback to call when complete.
     * @return {Promise} A promise that is resolved when complete.
     */
    connectionProfileStoreSave(connectionProfile, connectionOptions, callback) {
        const method = 'connectionProfileStoreSave';
        LOG.entry(method, connectionProfile, connectionOptions);
        return this.connectionProfileStore.save(connectionProfile, connectionOptions)
            .then(() => {
                callback(null);
                LOG.exit(method);
            })
            .catch((error) => {
                LOG.error(error);
                callback(ConnectorServer.serializerr(error));
                LOG.exit(method);
            });
    }

    /**
     * Handle a request from the client to load all connection profiles.
     * @param {function} callback The callback to call when complete.
     * @return {Promise} A promise that is resolved when complete.
     */
    connectionProfileStoreLoadAll(callback) {
        const method = 'connectionProfileStoreLoadAll';
        LOG.entry(method);
        return this.connectionProfileStore.loadAll()
            .then((result) => {
                callback(null, result);
                LOG.exit(method, result);
            })
            .catch((error) => {
                LOG.error(error);
                callback(ConnectorServer.serializerr(error));
                LOG.exit(method, null);
            });
    }

    /**
     * Handle a request from the client to delete a connection profile.
     * @param {string} connectionProfile The name of the connection profile
     * @param {function} callback The callback to call when complete.
     * @return {Promise} A promise that is resolved when complete.
     */
    connectionProfileStoreDelete(connectionProfile, callback) {
        const method = 'connectionProfileStoreDelete';
        LOG.entry(method, connectionProfile);
        return this.connectionProfileStore.delete(connectionProfile)
            .then(() => {
                callback(null);
                LOG.exit(method);
            })
            .catch((error) => {
                LOG.error(error);
                callback(ConnectorServer.serializerr(error));
                LOG.exit(method);
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
    connectionManagerImportIdentity(connectionProfile, connectionOptions, id, certificate, privateKey, callback) {
        const method = 'connectionManagerImportIdentity';
        LOG.entry(method, connectionProfile, id, certificate, privateKey);
        return this.connectionProfileManager.getConnectionManager(connectionProfile)
            .then((connectionManager) => {
                return connectionManager.importIdentity(connectionProfile, connectionOptions, id, certificate, privateKey);
            })
            .then(() => {
                callback(null);
                LOG.exit(method);
            })
            .catch((error) => {
                LOG.error(error);
                callback(ConnectorServer.serializerr(error));
                LOG.exit(method, null);
            });
    }

    /**
     * Obtain the credentials associated with a given identity.
     * @param {String} connectionProfileName - Name of the connection profile.
     * @param {Object} connectionOptions - connection options loaded from the profile.
     * @param {String} id - Name of the identity.
     * @param {function} callback The callback to call when complete.
     * @return {Promise} Promise that resolves to credentials.
     */
    connectionManagerExportIdentity(connectionProfileName, connectionOptions, id, callback) {
        const method = 'connectionManagerExportIdentity';
        LOG.entry(method, connectionProfileName, connectionOptions, id);
        return this.connectionProfileManager.getConnectionManager(connectionProfileName)
            .then((connectionManager) => {
                return connectionManager.exportIdentity(connectionProfileName, connectionOptions, id);
            })
            .then((credentials) => {
                callback(null, credentials);
                LOG.exit(method, credentials);
            })
            .catch((error) => {
                LOG.error(error);
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
     * @return {Promise} A promise that is resolved when complete.
     */
    connectionManagerConnect(connectionProfile, businessNetworkIdentifier, connectionOptions, callback) {
        const method = 'connectionManagerConnect';
        LOG.entry(method, connectionProfile, businessNetworkIdentifier, connectionOptions);
        return this.connectionProfileStore.load(connectionProfile, connectionOptions)
            .then((existingConnectionOptions) => {
                connectionOptions = Object.assign({}, existingConnectionOptions, connectionOptions);
            })
            .catch((error) => {
                // Ignore, it doesn't exist.
            })
            .then(() => {
                return this.connectionProfileStore.save(connectionProfile, connectionOptions);
            })
            .then(() => {
                return this.connectionProfileManager.connect(connectionProfile, businessNetworkIdentifier);
            })
            .then((connection) => {
                let connectionID = uuid.v4();
                this.connections[connectionID] = connection;
                callback(null, connectionID);
                LOG.exit(method, connectionID);
            })
            .catch((error) => {
                LOG.error(error);
                callback(ConnectorServer.serializerr(error));
                LOG.exit(method, null);
            });
    }

    /**
     * Handle a request from the client to disconnect from a business network.
     * @param {string} connectionID The connection ID.
     * @param {function} callback The callback to call when complete.
     * @return {Promise} A promise that is resolved when complete.
     */
    connectionDisconnect(connectionID, callback) {
        const method = 'connectionDisconnect';
        LOG.entry(method, connectionID);
        let connection = this.connections[connectionID];
        if (!connection) {
            let error = new Error(`No connection found with ID ${connectionID}`);
            LOG.error(error);
            callback(ConnectorServer.serializerr(error));
            LOG.exit(method, null);
            return Promise.resolve();
        }
        delete this.connections[connectionID];

        connection.removeListener('events', () => {});

        return connection.disconnect()
            .then(() => {
                callback(null);
                LOG.exit(method);
            })
            .catch((error) => {
                LOG.error(error);
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
    connectionLogin(connectionID, enrollmentID, enrollmentSecret, callback) {
        const method = 'connectionLogin';
        LOG.entry(method, connectionID, enrollmentID, enrollmentSecret);
        let connection = this.connections[connectionID];
        if (!connection) {
            let error = new Error(`No connection found with ID ${connectionID}`);
            LOG.error(error);
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
                LOG.error(error);
                callback(ConnectorServer.serializerr(error));
                LOG.exit(method);
            });
    }

    /**
     * Handle a request from the client to install the runtime.
     * @param {string} connectionID The connection ID.
     * @param {string} securityContextID The security context ID.
     * @param {string} businessNetworkIdentifier The business network identifier
     * @param {Object} installOptions connector specific install options
     * @param {function} callback The callback to call when complete.
     * @return {Promise} A promise that is resolved when complete.
     */
    connectionInstall(connectionID, securityContextID, businessNetworkIdentifier, installOptions, callback) {
        const method = 'connectionDeploy';
        LOG.entry(method, connectionID, securityContextID, businessNetworkIdentifier, installOptions);
        let connection = this.connections[connectionID];
        if (!connection) {
            let error = new Error(`No connection found with ID ${connectionID}`);
            LOG.error(error);
            callback(ConnectorServer.serializerr(error));
            LOG.exit(method, null);
            return Promise.resolve();
        }
        let securityContext = this.securityContexts[securityContextID];
        if (!securityContext) {
            let error = new Error(`No security context found with ID ${securityContextID}`);
            LOG.error(error);
            callback(ConnectorServer.serializerr(error));
            LOG.exit(method, null);
            return Promise.resolve();
        }
        return connection.install(securityContext, businessNetworkIdentifier, installOptions)
            .then(() => {
                callback(null);
                LOG.exit(method);
            })
            .catch((error) => {
                LOG.error(error);
                callback(ConnectorServer.serializerr(error));
                LOG.exit(method);
            });
    }

    /**
     * Handle a request from the client to start a business network.
     * @param {string} connectionID The connection ID.
     * @param {string} securityContextID The security context ID.
     * @param {string} businessNetworkIdentifier The identifier of the Business network that will be started in this installed runtime
     * @param {string} startTransaction The serialized start transaction.
     * @param {Object} startOptions connector specific installation options.
     * @param {function} callback The callback to call when complete.
     * @return {Promise} A promise that is resolved when complete.
     */
    connectionStart(connectionID, securityContextID, businessNetworkIdentifier, startTransaction, startOptions, callback) {
        const method = 'connectionDeploy';
        LOG.entry(method, connectionID, securityContextID, businessNetworkIdentifier, startTransaction, startOptions);
        let connection = this.connections[connectionID];
        if (!connection) {
            let error = new Error(`No connection found with ID ${connectionID}`);
            LOG.error(error);
            callback(ConnectorServer.serializerr(error));
            LOG.exit(method, null);
            return Promise.resolve();
        }
        let securityContext = this.securityContexts[securityContextID];
        if (!securityContext) {
            let error = new Error(`No security context found with ID ${securityContextID}`);
            LOG.error(error);
            callback(ConnectorServer.serializerr(error));
            LOG.exit(method, null);
            return Promise.resolve();
        }
        return connection.start(securityContext, businessNetworkIdentifier, startTransaction, startOptions)
            .then(() => {
                callback(null);
                LOG.exit(method);
            })
            .catch((error) => {
                LOG.error(error);
                callback(ConnectorServer.serializerr(error));
                LOG.exit(method);
            });
    }

    /**
     * Handle a request from the client to deploy a business network.
     * @param {string} connectionID The connection ID.
     * @param {string} securityContextID The security context ID.
     * @param {string} businessNetworkIdentifier The identifier of the Business network that will be started in this installed runtime
     * @param {string} deployTransaction The serialized deploy transaction.
     * @param {Object} deployOptions connector specific deployment options.
     * @param {function} callback The callback to call when complete.
     * @return {Promise} A promise that is resolved when complete.
     */
    connectionDeploy(connectionID, securityContextID, businessNetworkIdentifier, deployTransaction, deployOptions, callback) {
        const method = 'connectionDeploy';
        LOG.entry(method, connectionID, securityContextID, businessNetworkIdentifier, deployTransaction, deployOptions);
        let connection = this.connections[connectionID];
        if (!connection) {
            let error = new Error(`No connection found with ID ${connectionID}`);
            LOG.error(error);
            callback(ConnectorServer.serializerr(error));
            LOG.exit(method, null);
            return Promise.resolve();
        }
        let securityContext = this.securityContexts[securityContextID];
        if (!securityContext) {
            let error = new Error(`No security context found with ID ${securityContextID}`);
            LOG.error(error);
            callback(ConnectorServer.serializerr(error));
            LOG.exit(method, null);
            return Promise.resolve();
        }
        return connection.deploy(securityContext, businessNetworkIdentifier, deployTransaction, deployOptions)
            .then(() => {
                callback(null);
                LOG.exit(method);
            })
            .catch((error) => {
                LOG.error(error);
                callback(ConnectorServer.serializerr(error));
                LOG.exit(method);
            });
    }

    /**
     * Handle a request from the client to update a deployed business network.
     * @param {string} connectionID The connection ID.
     * @param {string} securityContextID The security context ID.
     * @param {string} businessNetworkBase64 The business network archive, as a base64 encoded string.
     * @param {function} callback The callback to call when complete.
     * @return {Promise} A promise that is resolved when complete.
     */
    connectionUpdate(connectionID, securityContextID, businessNetworkBase64, callback) {
        const method = 'connectionUpdate';
        LOG.entry(method, connectionID, securityContextID, businessNetworkBase64);
        let connection = this.connections[connectionID];
        if (!connection) {
            let error = new Error(`No connection found with ID ${connectionID}`);
            LOG.error(error);
            callback(ConnectorServer.serializerr(error));
            LOG.exit(method, null);
            return Promise.resolve();
        }
        let securityContext = this.securityContexts[securityContextID];
        if (!securityContext) {
            let error = new Error(`No security context found with ID ${securityContextID}`);
            LOG.error(error);
            callback(ConnectorServer.serializerr(error));
            LOG.exit(method, null);
            return Promise.resolve();
        }
        let businessNetworkArchive = Buffer.from(businessNetworkBase64, 'base64');
        return BusinessNetworkDefinition.fromArchive(businessNetworkArchive)
            .then((businessNetworkDefinition) => {
                return connection.update(securityContext, businessNetworkDefinition);
            })
            .then(() => {
                callback(null);
                LOG.exit(method);
            })
            .catch((error) => {
                LOG.error(error);
                callback(ConnectorServer.serializerr(error));
                LOG.exit(method);
            });
    }

    /**
     * Handle a request from the client to undeploy a deployed business network.
     * @param {string} connectionID The connection ID.
     * @param {string} securityContextID The security context ID.
     * @param {string} businessNetworkIdentifier The business network identifier.
     * @param {function} callback The callback to call when complete.
     * @return {Promise} A promise that is resolved when complete.
     */
    connectionUndeploy(connectionID, securityContextID, businessNetworkIdentifier, callback) {
        const method = 'connectionUndeploy';
        LOG.entry(method, connectionID, securityContextID, businessNetworkIdentifier);
        let connection = this.connections[connectionID];
        if (!connection) {
            let error = new Error(`No connection found with ID ${connectionID}`);
            LOG.error(error);
            callback(ConnectorServer.serializerr(error));
            LOG.exit(method, null);
            return Promise.resolve();
        }
        let securityContext = this.securityContexts[securityContextID];
        if (!securityContext) {
            let error = new Error(`No security context found with ID ${securityContextID}`);
            LOG.error(error);
            callback(ConnectorServer.serializerr(error));
            LOG.exit(method, null);
            return Promise.resolve();
        }
        return connection.undeploy(securityContext, businessNetworkIdentifier)
            .then(() => {
                callback(null);
                LOG.exit(method);
            })
            .catch((error) => {
                LOG.error(error);
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
    connectionPing(connectionID, securityContextID, callback) {
        const method = 'connectionPing';
        LOG.entry(method, connectionID, securityContextID);
        let connection = this.connections[connectionID];
        if (!connection) {
            let error = new Error(`No connection found with ID ${connectionID}`);
            LOG.error(error);
            callback(ConnectorServer.serializerr(error));
            LOG.exit(method, null);
            return Promise.resolve();
        }
        let securityContext = this.securityContexts[securityContextID];
        if (!securityContext) {
            let error = new Error(`No security context found with ID ${securityContextID}`);
            LOG.error(error);
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
                LOG.error(error);
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
    connectionQueryChainCode(connectionID, securityContextID, functionName, args, callback) {
        const method = 'connectionQueryChainCode';
        LOG.entry(method, connectionID, securityContextID, functionName, args);
        let connection = this.connections[connectionID];
        if (!connection) {
            let error = new Error(`No connection found with ID ${connectionID}`);
            LOG.error(error);
            callback(ConnectorServer.serializerr(error));
            LOG.exit(method, null);
            return Promise.resolve();
        }
        let securityContext = this.securityContexts[securityContextID];
        if (!securityContext) {
            let error = new Error(`No security context found with ID ${securityContextID}`);
            LOG.error(error);
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
                LOG.error(error);
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
     * @param {function} callback The callback to call when complete.
     * @return {Promise} A promise that is resolved when complete.
     */
    connectionInvokeChainCode(connectionID, securityContextID, functionName, args, callback) {
        const method = 'connectionInvokeChainCode';
        LOG.entry(method, connectionID, securityContextID, functionName, args);
        let connection = this.connections[connectionID];
        if (!connection) {
            let error = new Error(`No connection found with ID ${connectionID}`);
            LOG.error(error);
            callback(ConnectorServer.serializerr(error));
            LOG.exit(method, null);
            return Promise.resolve();
        }
        let securityContext = this.securityContexts[securityContextID];
        if (!securityContext) {
            let error = new Error(`No security context found with ID ${securityContextID}`);
            LOG.error(error);
            callback(ConnectorServer.serializerr(error));
            LOG.exit(method, null);
            return Promise.resolve();
        }
        return connection.invokeChainCode(securityContext, functionName, args)
            .then(() => {
                callback(null);
                LOG.exit(method);
            })
            .catch((error) => {
                LOG.error(error);
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
    connectionCreateIdentity(connectionID, securityContextID, userID, options, callback) {
        const method = 'connectionCreateIdentity';
        LOG.entry(method, connectionID, securityContextID, userID, options);
        let connection = this.connections[connectionID];
        if (!connection) {
            let error = new Error(`No connection found with ID ${connectionID}`);
            LOG.error(error);
            callback(ConnectorServer.serializerr(error));
            LOG.exit(method, null);
            return Promise.resolve();
        }
        let securityContext = this.securityContexts[securityContextID];
        if (!securityContext) {
            let error = new Error(`No security context found with ID ${securityContextID}`);
            LOG.error(error);
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
                LOG.error(error);
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
    connectionList(connectionID, securityContextID, callback) {
        const method = 'connectionList';
        LOG.entry(method, connectionID, securityContextID);
        let connection = this.connections[connectionID];
        if (!connection) {
            let error = new Error(`No connection found with ID ${connectionID}`);
            LOG.error(error);
            callback(ConnectorServer.serializerr(error));
            LOG.exit(method, null);
            return Promise.resolve();
        }
        let securityContext = this.securityContexts[securityContextID];
        if (!securityContext) {
            let error = new Error(`No security context found with ID ${securityContextID}`);
            LOG.error(error);
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
                LOG.error(error);
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
    connectionCreateTransactionId(connectionID, securityContextID, callback) {
        const method = 'connectionCreateTransactionId';
        LOG.entry(method, connectionID, securityContextID);
        let connection = this.connections[connectionID];
        if (!connection) {
            let error = new Error(`No connection found with ID ${connectionID}`);
            LOG.error(error);
            callback(ConnectorServer.serializerr(error));
            LOG.exit(method, null);
            return Promise.resolve();
        }
        let securityContext = this.securityContexts[securityContextID];
        if (!securityContext) {
            let error = new Error(`No security context found with ID ${securityContextID}`);
            LOG.error(error);
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
                LOG.error(error);
                callback(ConnectorServer.serializerr(error));
                LOG.exit(method, null);
            });
    }
}

module.exports = ConnectorServer;
