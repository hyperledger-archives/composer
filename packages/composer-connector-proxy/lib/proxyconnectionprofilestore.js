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

const ConnectionProfileStore = require('composer-common').ConnectionProfileStore;
const ProxyUtil = require('./proxyutil');
const socketIOClient = require('socket.io-client');
const Logger = require('composer-common').Logger;

const LOG = Logger.getLog('ProxyConnectionProfileStore');

let connectorServerURL = 'http://localhost:15699';

/**
 * Manages persistence of connection profiles by communicating with a real connection
 * profile store in the connector server over the socket.io transport.
 */
class ProxyConnectionProfileStore extends ConnectionProfileStore {

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
    constructor() {
        super();
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
     * Loads connectOptions for a given connection profile.
     *
     * @param {string} connectionProfile The name of the connection profile to load
     * @return {Promise} A promise that is resolved with a JS Object for the
     * data in the connection profile.
     */
    load(connectionProfile) {
        const method = 'load';
        LOG.entry(method, connectionProfile);
        return this.ensureConnected()
            .then(() => {
                return new Promise((resolve, reject) => {
                    this.socket.emit('/api/connectionProfileStoreLoad', connectionProfile, (error, result) => {
                        if (error) {
                            return reject(ProxyUtil.inflaterr(error));
                        }
                        LOG.exit(method, result);
                        resolve(result);
                    });
                });
            });
    }

    /**
     * Save connectOptions for a given connection profile.
     *
     * @param {string} connectionProfile The name of the connection profile to save
     * @param {Object} connectOptions The connection options object
     * @return {Promise} A promise that once the data is written
     */
    save(connectionProfile, connectOptions) {
        const method = 'save';
        LOG.entry(method, connectionProfile, connectOptions);
        return this.ensureConnected()
            .then(() => {
                return new Promise((resolve, reject) => {
                    this.socket.emit('/api/connectionProfileStoreSave', connectionProfile, connectOptions, (error) => {
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
     * Loads all of the connection profiles.
     *
     * @return {Promise} A promise that is resolved with a JS Object where the
     * keys are the connection profiles, and the values are the connection options.
     */
    loadAll() {
        const method = 'loadAll';
        LOG.entry(method);
        return this.ensureConnected()
            .then(() => {
                return new Promise((resolve, reject) => {
                    this.socket.emit('/api/connectionProfileStoreLoadAll', (error, result) => {
                        if (error) {
                            return reject(ProxyUtil.inflaterr(error));
                        }
                        LOG.exit(method, result);
                        resolve(result);
                    });
                });
            });
    }

    /**
     * Delete the given connection profile.
     *
     * @param {string} connectionProfile The name of the connection profile to delete
     * @return {Promise} A promise that is resolved when the connection profile
     * is deleted.
     */
    delete(connectionProfile) {
        const method = 'delete';
        LOG.entry(method, connectionProfile);
        return this.ensureConnected()
            .then(() => {
                return new Promise((resolve, reject) => {
                    this.socket.emit('/api/connectionProfileStoreDelete', connectionProfile, (error) => {
                        if (error) {
                            return reject(ProxyUtil.inflaterr(error));
                        }
                        LOG.exit(method);
                        resolve();
                    });
                });
            });
    }

}

module.exports = ProxyConnectionProfileStore;
