/*
 * IBM Confidential
 * OCO Source Materials
 * IBM Concerto - Blockchain Solution Framework
 * Copyright IBM Corp. 2016
 * The source code for this program is not published or otherwise
 * divested of its trade secrets, irrespective of what has
 * been deposited with the U.S. Copyright Office.
 */

'use strict';

const ConnectionManager = require('composer-common').ConnectionManager;
const inflaterr = require('./proxyutil').inflaterr;
const ProxyConnection = require('./proxyconnection');
const socketIOClient = require('socket.io-client');

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
     * Establish a connection to the business network.
     * @param {string} connectionProfile The name of the connection profile
     * @param {string} businessNetworkIdentifier The identifier of the business network
     * @param {object} connectionOptions The connection options loaded from the profile
     * @return {Promise} A promise that is resolved with a {@link Connection}
     * object once the connection is established, or rejected with a connection error.
     */
    connect(connectionProfile, businessNetworkIdentifier, connectionOptions) {
        return this.ensureConnected()
            .then(() => {
                return new Promise((resolve, reject) => {
                    this.socket.emit('/api/connectionManagerConnect', connectionProfile, businessNetworkIdentifier, connectionOptions, (error, connectionID) => {
                        if (error) {
                            return reject(inflaterr(error));
                        }
                        let connection = new ProxyConnection(this, connectionProfile, businessNetworkIdentifier, this.socket, connectionID);
                        resolve(connection);
                    });
                });
            });
    }

}

module.exports = ProxyConnectionManager;
