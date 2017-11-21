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

const ConnectionManager = require('composer-common').ConnectionManager;
const ProxyConnection = require('./proxyconnection');
const ProxyUtil = require('./proxyutil');
const socketIOClient = require('socket.io-client');
const Logger = require('composer-common').Logger;

const LOG = Logger.getLog('ProxyConnectionManager');

let connectorServerURL = 'http://localhost:15699';

/**
 * Base class representing a connection manager that establishes and manages
 * connections to one or more business networks.
 * @protected
 * @abstract
 */
class ProxyConnectionManager extends ConnectionManager {

    /**
     * Set the connector server URL to use.
     * @param {string} url The connector server URL to use.
     */
    static setConnectorServerURL(url) {
        connectorServerURL = url;
    }

    /**
     * Create a connection for ease of unit testing
     * @param {ProxyConnectionManager} _this The ConnectionManaget
     * @param {String} connectionProfile The connection profile to use
     * @param {String} businessNetworkIdentifier The network identifier to use
     * @param {Socket.io} socket The socket to use
     * @param {String} connectionID The connection ID to use
     * @returns {ProxyConnection} The connection
     */
    static createConnection(_this, connectionProfile, businessNetworkIdentifier, socket, connectionID) {
        return new ProxyConnection(_this, connectionProfile, businessNetworkIdentifier, socket, connectionID);

    }

    /**
     * Creates a new ProxyConnectionManager
     * @param {ConnectionProfileManager} connectionProfileManager
     * - the ConnectionProfileManager used to manage access connection profiles.
     */
    constructor(connectionProfileManager) {
        super(connectionProfileManager);
        this.connected = false;
        this.socket = socketIOClient(connectorServerURL);
        this.socket.on('connect', () => {
            this.connected = true;
        });
        this.socket.on('disconnect', () => {
            this.connected = false;
        });
    }

    /**
     * Ensure that we are connected to the connector server.
     * @return {Promise} A promise that will be resolved when we
     * are connected to the connector server, or rejected with an
     * error.
     */
    ensureConnected() {
        if (this.connected) {
            return Promise.resolve();
        }
        return new Promise((resolve, reject) => {
            this.socket.once('connect', () => {
                resolve();
            });
        });
    }

    /**
     * Import an identity into a profile wallet or keystore.
     * @param {string} connectionProfile The name of the connection profile
     * @param {object} connectionOptions The connection options loaded from the profile
     * @param {string} id the id to associate with the identity
     * @param {string} certificate the certificate
     * @param {string} privateKey the private key
     * @returns {Promise} a promise
     */
    importIdentity(connectionProfile, connectionOptions, id, certificate, privateKey) {
        const method = 'importIdentity';
        LOG.entry(method, connectionProfile, connectionOptions, id, certificate);
        return this.ensureConnected()
            .then(() => {
                return new Promise((resolve, reject) => {
                    this.socket.emit('/api/connectionManagerImportIdentity', connectionProfile, connectionOptions, id, certificate, privateKey, (error) => {
                        if (error) {
                            return reject(ProxyUtil.inflaterr(error));
                        }
                        LOG.exit(method);
                        resolve();
                    });
                });
            });
    }

    /**
     * Remove an identity from a profile wallet.
     * @param {string} connectionProfile The name of the connection profile
     * @param {object} connectionOptions The connection options loaded from the profile
     * @param {string} id the id to associate with the identity
     * @returns {Promise} a promise
     */
    removeIdentity(connectionProfile, connectionOptions, id) {
        const method = 'importIdentity';
        LOG.entry(method, connectionProfile, connectionOptions, id);
        return this.ensureConnected()
            .then(() => {
                return new Promise((resolve, reject) => {
                    this.socket.emit('/api/connectionManagerRemoveIdentity', connectionProfile, connectionOptions, id, (error) => {
                        if (error) {
                            return reject(ProxyUtil.inflaterr(error));
                        }
                        LOG.exit(method);
                        resolve();
                    });
                });
            });
    }


    /**
     * Obtain the credentials associated with a given identity.
     * @param {String} connectionProfileName - Name of the connection profile.
     * @param {Object} connectionOptions - connection options loaded from the profile.
     * @param {String} id - Name of the identity.
     * @return {Promise} Resolves to credentials in the form <em>{ certificate: String, privateKey: String }</em>.
     */
    exportIdentity(connectionProfileName, connectionOptions, id) {
        const method = 'exportIdentity';
        LOG.entry(method, connectionProfileName, connectionOptions, id);
        return this.ensureConnected()
            .then(() => {
                return new Promise((resolve, reject) => {
                    this.socket.emit('/api/connectionManagerExportIdentity', connectionProfileName, connectionOptions, id, (error, credentials) => {
                        if (error) {
                            return reject(ProxyUtil.inflaterr(error));
                        }
                        LOG.exit(method, credentials);
                        resolve(credentials);
                    });
                });
            });
    }

    /**
     * Establish a connection to the business network.
     * @param {string} connectionProfile The name of the connection profile
     * @param {string} businessNetworkIdentifier The identifier of the business network
     * @param {object} connectionOptions The connection options loaded from the profile
     * @return {Promise} A promise that is resolved with a {@link Connection}
     * object once the connection is established, or rejected with a connection error.
     */
    connect(connectionProfile, businessNetworkIdentifier, connectionOptions) {
        const method = 'connect';
        LOG.entry(method, connectionProfile, businessNetworkIdentifier, connectionOptions);
        return this.ensureConnected()
            .then(() => {
                return new Promise((resolve, reject) => {
                    this.socket.emit('/api/connectionManagerConnect', connectionProfile, businessNetworkIdentifier, connectionOptions, (error, connectionID) => {
                        if (error) {
                            return reject(ProxyUtil.inflaterr(error));
                        }
                        let connection = ProxyConnectionManager.createConnection(this, connectionProfile, businessNetworkIdentifier, this.socket, connectionID);
                        // Only emit when client
                        this.socket.on('events', (myConnectionID, events) => {
                            LOG.debug(method, events);
                            if (myConnectionID === connectionID) {
                                connection.emit('events', events);
                            }
                        });
                        LOG.exit(method, connection);
                        resolve(connection);
                    });
                });
            });
    }

}

module.exports = ProxyConnectionManager;
