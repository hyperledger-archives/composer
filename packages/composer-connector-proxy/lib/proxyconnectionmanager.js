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
const uuid = require('uuid');

const LOG = Logger.getLog('ProxyConnectionManager');

let connectorServerURL = 'http://localhost:15699';

let connectorStrategy = {
    closeOnDisconnect: true
};

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
     * @typedef Strategy
     * @property {boolean} closeOnDisconnect true to close socket when all connections are disconnected, false to always leave open
     */

    /**
     * Set the connector strategy
     * @param {Strategy} strategy the connector strategy
     */
    static setConnectorStrategy(strategy) {
        if (strategy) {
            connectorStrategy = strategy;
        }
    }

    /**
     * get the connector strategy
     * @returns {Strategy} strategy the connector strategy
     */
    static getConnectorStrategy() {
        return connectorStrategy;
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
        this.connections = new Set();
        this.connected = false;
    }

    /**
     * notification of a connection managed by this instance has disconnected.
     * @param {string} connectionID the connectionID that was disconnected.
     */
    disconnect(connectionID) {
        if (this.connections.has(connectionID)) {
            this.connections.delete(connectionID);
            if (this.connections.size === 0 && connectorStrategy.closeOnDisconnect) {
                this.socket.close();

                // throw away the socket rather than try to wait for a close and reconnect it if a
                // connection is required as it's easier
                this.socket = null;
            }
        }
    }

    /**
     * Ensure that we are connected to the connector server.
     * @return {Promise} A promise that will be resolved when we
     * are connected to the connector server, or rejected with an
     * error.
     */
    ensureConnected() {
        const method = 'ensureConnected';
        LOG.entry(method);

        if (this.socket && this.connected) {
            LOG.exit(method, 'socket already connected');
            return Promise.resolve();
        }

        LOG.debug(method, 'no socket or socket not connected, creating a new socket');
        this.socket = socketIOClient(connectorServerURL);
        this.socket.once('disconnect', () => {
            LOG.debug(method, 'socket disconnect received');
            this.connected = false;
        });

        // return a promise that will be fulfilled when connection is established
        return new Promise((resolve, reject) => {
            this.socket.once('connect', () => {
                LOG.debug(method, 'socket connect received');
                this.connected = true;
                resolve();
            });
            this.socket.once('connect_error', (error) => {
                LOG.exit(method, 'socket connect failed', error);
                // socket connect failed, so shouldn't be connected so will create a new
                // socket when a request to connect is made again.
                reject(error);
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
    async importIdentity(connectionProfile, connectionOptions, id, certificate, privateKey) {
        const method = 'importIdentity';
        LOG.entry(method, connectionProfile, connectionOptions, id, certificate);
        let tempConnection = uuid.v4();
        this.connections.add(tempConnection);
        await this.ensureConnected();
        return new Promise((resolve, reject) => {
            this.socket.emit('/api/connectionManagerImportIdentity', connectionProfile, connectionOptions, id, certificate, privateKey, (error) => {
                this.disconnect(tempConnection);
                if (error) {
                    return reject(ProxyUtil.inflaterr(error));
                }
                LOG.exit(method);
                resolve();
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
    async removeIdentity(connectionProfile, connectionOptions, id) {
        const method = 'importIdentity';
        LOG.entry(method, connectionProfile, connectionOptions, id);
        let tempConnection = uuid.v4();
        this.connections.add(tempConnection);
        await this.ensureConnected();
        return new Promise((resolve, reject) => {
            this.socket.emit('/api/connectionManagerRemoveIdentity', connectionProfile, connectionOptions, id, (error) => {
                this.disconnect(tempConnection);
                if (error) {
                    return reject(ProxyUtil.inflaterr(error));
                }
                LOG.exit(method);
                resolve();
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
    async exportIdentity(connectionProfileName, connectionOptions, id) {
        const method = 'exportIdentity';
        LOG.entry(method, connectionProfileName, connectionOptions, id);
        let tempConnection = uuid.v4();
        this.connections.add(tempConnection);
        await this.ensureConnected();
        return new Promise((resolve, reject) => {
            this.socket.emit('/api/connectionManagerExportIdentity', connectionProfileName, connectionOptions, id, (error, credentials) => {
                this.disconnect(tempConnection);
                if (error) {
                    return reject(ProxyUtil.inflaterr(error));
                }
                LOG.exit(method, credentials);
                resolve(credentials);
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
    async connect(connectionProfile, businessNetworkIdentifier, connectionOptions) {
        const method = 'connect';
        LOG.entry(method, connectionProfile, businessNetworkIdentifier, connectionOptions);

        // create a temporary connection to avoid a problem with a disconnect breaking a connect
        // setup due to timing.
        let tempConnection = uuid.v4();
        this.connections.add(tempConnection);
        await this.ensureConnected();

        return new Promise((resolve, reject) => {
            this.socket.emit('/api/connectionManagerConnect', connectionProfile, businessNetworkIdentifier, connectionOptions, (error, connectionID) => {
                if (error) {
                    this.disconnect(tempConnection);
                    return reject(ProxyUtil.inflaterr(error));
                }
                let connection = ProxyConnectionManager.createConnection(this, connectionProfile, businessNetworkIdentifier, this.socket, connectionID);
                this.connections.add(connectionID);
                // remove the temp connection now the real one has been added
                this.disconnect(tempConnection);
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
    }

}

module.exports = ProxyConnectionManager;
