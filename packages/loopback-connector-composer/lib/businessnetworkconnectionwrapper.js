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

const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
const debug = require('debug')('loopback:connector:composer');

/**
 * A wrapper around a instance of {@link BusinessNetworkConnection}.
 */
class BusinessNetworkConnectionWrapper {

    /**
     * Constructor.
     * @param {Object} settings the settings used by the call to BusinessNetworkConnection
     */
    constructor(settings) {
        debug('BusinessNetworkConnectionWrapper', settings);

        // Check for required properties.
        if (!settings.card) {
            throw new Error('card not specified');
        }
        this.settings = settings;

        // Create the new disconnected business network connection.
        this.businessNetworkConnection = new BusinessNetworkConnection({
            fs: settings.fs,
            cardStore: settings.cardStore
        });
        this.connected = this.connecting = false;
        this.connectionPromise = null;

    }

    /**
     * Ensure that the connector has connected to Composer.
     * @return {Promise} A promise that is resolved with a {@link BusinessNetworkConnection}
     * when the connector has connected, or rejected with an error.
     */
    ensureConnected() {
        debug('ensureConnected');
        if (this.connected) {
            return Promise.resolve(this.businessNetworkConnection);
        } else if (this.connecting) {
            return this.connectionPromise;
        } else {
            return this.connect();
        }
    }

    /**
     * Connect to the Business Network
     * @return {Promise} A promise that is resolved when the connector has connected.
     */
    connect() {
        debug('connect');
        this.connecting = true;
        this.connected = false;
        this.connectionPromise = this.businessNetworkConnection.connect(this.settings.card)
            .then((businessNetwork) => {
                this.businessNetwork = businessNetwork;
                this.serializer = this.businessNetwork.getSerializer();
                this.modelManager = this.businessNetwork.getModelManager();
                this.introspector = this.businessNetwork.getIntrospector();
            })
            .then(() => {
                this.connected = true;
                this.connecting = false;
                return this.businessNetworkConnection;
            })
            .catch((error) => {
                this.connected = this.connecting = false;
                throw error;
            });
        return this.connectionPromise;
    }

    /**
     * Disconnects from the Hyperledger Fabric.
     * @return {Promise} A promise that will be resolved when the connection is
     * terminated.
     */
    disconnect () {
        debug('disconnect');

        // Remove all registered event listeners.
        this.businessNetworkConnection.removeAllListeners();

        // Now disconnect from the business network.
        return this.businessNetworkConnection.disconnect()
            .then(() => {
                this.connected = this.connecting = false;
            })
            .catch((error) => {
                this.connected = this.connecting = false;
                throw error;
            });
    }

    /**
     * Returns the currently connected BusinessNetworkDefinition
     * @returns {BusinessNetworkConnection} the business network
     */
    getBusinessNetworkConnection() {
        return this.businessNetworkConnection;
    }

    /**
     * Returns the currently connected BusinessNetworkDefinition
     * @returns {BusinessNetworkDefinition} the business network
     */
    getBusinessNetworkDefinition() {
        return this.businessNetwork;
    }

    /**
     * Provides access to the Serializer for this business network. The Serializer
     * is used to serialize instances of the types defined within this business network.
     * @return {Serializer} the Serializer for this business network
     */
    getSerializer() {
        return this.serializer;
    }

    /**
     * Provides access to the ModelManager for this business network. The ModelManager
     * manage access to the models that have been defined within this business network.
     * @return {ModelManager} the ModelManager for this business network
     */
    getModelManager() {
        return this.modelManager;
    }

    /**
     * Provides access to the Introspector for this business network. The Introspector
     * is used to reflect on the types defined within this business network.
     * @return {Introspector} the Introspector for this business network
     */
    getIntrospector() {
        return this.introspector;
    }

    /**
     * Determine if this connection is connected.
     * @return {boolean} True if this connection is connected, false otherwise.
     */
    isConnected() {
        return this.connected;
    }

    /**
     * Determine if this connection is in the process of connecting.
     * @return {boolean} True if this connection is connecting, false otherwise.
     */
    isConnecting() {
        return this.connecting;
    }

}

module.exports = BusinessNetworkConnectionWrapper;
