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
const BusinessNetworkCardStore = require('composer-common').BusinessNetworkCardStore;
const ProxyUtil = require('./proxyutil');
const socketIOClient = require('socket.io-client');
const Logger = require('composer-common').Logger;

const LOG = Logger.getLog('ProxyConnectionProfileStore');

let connectorServerURL = 'http://localhost:15699';

/**
 * Manages persistence of business network cards by communicating with a real
 * business network card store in the connector server over the socket.io transport.
 */
class ProxyBusinessNetworkCardStore extends BusinessNetworkCardStore {

    /**
     * Set the connector server URL to use.
     * @param {string} url The connector server URL to use.
     */
    static setConnectorServerURL (url) {
        connectorServerURL = url;
    }

    /**
     * Creates a new ProxyBusinessNetworkCardStore
     */
    constructor () {
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
    ensureConnected () {
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
     * Gets a card from the store.
     * @abstract
     * @param {String} cardName The name of the card to get
     * @return {Promise} A promise that is resolved with a {@link IdCard}.
     */
    get (cardName) {
        const method = 'get';
        LOG.entry(method, cardName);
        return this.ensureConnected()
            .then(() => {
                return new Promise((resolve, reject) => {
                    this.socket.emit('/api/businessNetworkCardStoreGet', cardName, (error, result) => {
                        if (error) {
                            return reject(ProxyUtil.inflaterr(error));
                        }

                        let cardProperties = result;
                        let idCard = new IdCard(cardProperties.metadata, cardProperties.connectionProfile);
                        idCard.setCredentials(cardProperties.credentials);

                        LOG.exit(method, idCard);
                        resolve(idCard);
                    });
                });
            });
    }

    /**
     * Has returns a boolean indicating whether a card with the specified name exists or not.
     * @abstract
     * @param {String} cardName The name of the card to check
     * @return {Promise} A promise resolved with true or false.
     */
    has(cardName) {
        const method = 'has';
        LOG.entry(method, cardName);
        return this.ensureConnected()
            .then(() => {
                return new Promise((resolve, reject) => {
                    this.socket.emit('/api/businessNetworkCardStoreHas', cardName, (error, result) => {
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
     * Puts a card in the store. It is an error to put a card name that already exists
     * in the store.
     * @param {String} cardName The name of the card to save
     * @param {IdCard} card The card
     * @return {Promise} A promise that resolves once the data is written
     */
    put (cardName, card) {
        const method = 'put';
        LOG.entry(method, cardName, card);
        return this.ensureConnected()
            .then(() => {
                return new Promise((resolve, reject) => {
                    this.socket.emit('/api/businessNetworkCardStorePut', cardName, card, (error, result) => {
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
     * Gets all cards from the store.
     * @return {Promise} A promise that is resolved with a {@link Map} where
     * the keys are identity card names and the values are {@link IdCard} objects.
     */
    getAll () {
        const method = 'getAll';
        LOG.entry(method);
        return this.ensureConnected()
            .then(() => {
                return new Promise((resolve, reject) => {
                    this.socket.emit('/api/businessNetworkCardStoreGetAll', (error, result) => {
                        if (error) {
                            return reject(ProxyUtil.inflaterr(error));
                        }
                        let resultMap = new Map();

                        Object.keys(result).forEach((key) => {
                            let cardProperties = result[key];
                            let idCard = new IdCard(cardProperties.metadata, cardProperties.connectionProfile);
                            idCard.setCredentials(cardProperties.credentials);
                            resultMap.set(key, idCard);
                        });
                        LOG.exit(method, resultMap);
                        resolve(resultMap);
                    });
                });
            });
    }

    /**
     * Delete a specific card from the store.
     * @param {String} cardName The name of the card to delete
     * @return {Promise} A promise that resolves when the card is deleted.
     */
    delete (cardName) {
        const method = 'delete';
        LOG.entry(method);
        return this.ensureConnected()
            .then(() => {
                return new Promise((resolve, reject) => {
                    this.socket.emit('/api/businessNetworkCardStoreDelete', cardName, (error, result) => {
                        if (error) {
                            return reject(ProxyUtil.inflaterr(error));
                        }
                        LOG.exit(method, result);
                        resolve(result);
                    });
                });
            });
    }

}

module.exports = ProxyBusinessNetworkCardStore;
