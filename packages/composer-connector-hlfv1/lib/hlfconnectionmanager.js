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

const Logger = require('composer-common').Logger;
const util = require('util');

const LOG = Logger.getLog('HLFConnectionManager');

global.hfc = {
    logger: {
        debug: () => {
            const args = Array.prototype.slice.call(arguments);
            const message = util.format.apply(util, args.map((arg) => {
                if (typeof arg === 'function') {
                    return '<function>';
                } else {
                    return arg;
                }
            }));
            LOG.debug('fabric-client', message);
        },
        info: () => {
            const args = Array.prototype.slice.call(arguments);
            const message = util.format.apply(util, args.map((arg) => {
                if (typeof arg === 'function') {
                    return '<function>';
                } else {
                    return arg.toString();
                }
            }));
            LOG.debug('fabric-client', message);
        },
        warn: () => {
            const args = Array.prototype.slice.call(arguments);
            const message = util.format.apply(util, args.map((arg) => {
                if (typeof arg === 'function') {
                    return '<function>';
                } else {
                    return arg;
                }
            }));
            LOG.debug('fabric-client', message);
        },
        error: () => {
            const args = Array.prototype.slice.call(arguments);
            const message = util.format.apply(util, args.map((arg) => {
                if (typeof arg === 'function') {
                    return '<function>';
                } else {
                    return arg;
                }
            }));
            LOG.debug('fabric-client', message);
        }
    }
};

const Client = require('fabric-client');
const ConnectionManager = require('composer-common').ConnectionManager;
const EventHub = require('fabric-client/lib/EventHub');
const FabricCAClientImpl = require('fabric-ca-client');
const HLFConnection = require('./hlfconnection');
const HLFWalletProxy = require('./hlfwalletproxy');
const Orderer = require('fabric-client/lib/Orderer');
const Peer = require('fabric-client/lib/Peer');
const Wallet = require('composer-common').Wallet;


/**
 * Class representing a connection manager that establishes and manages
 * connections to one or more business networks running on Hyperledger Fabric,
 * using the fabric-client module.
 * @private
 */
class HLFConnectionManager extends ConnectionManager {

    /**
     * Create a new client.
     * @return {Client} A new client.
     */
    static createClient() {
        return new Client();
    }

    /**
     * Create a new orderer.
     * @param {string} orderer The orderer URL.
     * @return {Orderer} A new orderer.
     */
    static createOrderer(orderer) {
        return new Orderer(orderer);
    }

    /**
     * Create a new peer.
     * @param {string} peer The peer URL.
     * @return {Peer} A new peer.
     */
    static createPeer(peer) {
        return new Peer(peer);
    }

    /**
     * Create a new event hub.
     * @return {EventHub} A new event hub.
     */
    static createEventHub() {
        return new EventHub();
    }

    /**
     * Create a new CA client.
     * @param {string} ca The CA URL.
     * @param {KeyValStore} keyValStore The key value store.
     * @return {FabricCAClientImpl} A new CA client.
     */
    static createCAClient(ca, keyValStore) {
        return new FabricCAClientImpl(ca, keyValStore);
    }

    /**
     * Creates a new Hyperledger Fabric connection manager.
     * @param {ConnectionProfileManager} connectionProfileManager
     * - the ConnectionProfileManager used to manage access connection profiles.
     */
    constructor(connectionProfileManager) {
        super(connectionProfileManager);
        const method = 'constructor';
        LOG.entry(method, connectionProfileManager);
        LOG.exit(method);
    }

    /**
     * Establish a connection to the business network.
     * @param {string} connectionProfile The name of the connection profile
     * @param {string} businessNetworkIdentifier The identifier of the business network (no version!)
     * @param {object} connectOptions The connection options loaded from the profile
     * @return {Promise} A promise that is resolved with a {@link Connection}
     * object once the connection is established, or rejected with a connection error.
     */
    connect(connectionProfile, businessNetworkIdentifier, connectOptions) {
        const method = 'connect';
        LOG.entry(method, connectionProfile, businessNetworkIdentifier, connectOptions);

        // Validate all the arguments.
        if (!connectionProfile) {
            throw new Error('connectionProfile not specified');
        } else if (!connectOptions) {
            throw new Error('connectOptions not specified');
        }

        // Validate the connection profile.
        let wallet = Wallet.getWallet();
        if (!Array.isArray(connectOptions.orderers)) {
            throw new Error('The orderers array has not been specified in the connection profile');
        } else if (!connectOptions.orderers.length) {
            throw new Error('No orderer URLs have been specified in the connection profile');
        } else if (!Array.isArray(connectOptions.peers)) {
            throw new Error('The peers array has not been specified in the connection profile');
        } else if (!connectOptions.peers.length) {
            throw new Error('No peer URLs have been specified in the connection profile');
        } else if (!Array.isArray(connectOptions.events)) {
            throw new Error('The events array has not been specified in the connection profile');
        } else if (!connectOptions.events.length) {
            throw new Error('No event hub URLs have been specified in the connection profile');
        } else if (connectOptions.events.length !== connectOptions.peers.length) {
            throw new Error('there should be an identical number of event hub urls to peers');
        } else if (!wallet && !connectOptions.keyValStore) {
            throw new Error('No key value store directory has been specified');
        } else if (!connectOptions.ca) {
            throw new Error('The certificate authority URL has not been specified in the connection profile');
        } else if (!connectOptions.channel) {
            throw new Error('No channel has been specified in the connection profile');
        }

        // Default the optional connection options.
        if (!connectOptions.deployWaitTime) {
            connectOptions.deployWaitTime = 60;
        }
        if (!connectOptions.invokeWaitTime) {
            connectOptions.invokeWaitTime = 60;
        }

        // Create a new client instance.
        const client = HLFConnectionManager.createClient();

        // Create a new chain instance.
        const chain = client.newChain(connectOptions.channel);

        // Load all of the orderers into the client.
        connectOptions.orderers.forEach((orderer) => {
            LOG.debug(method, 'Adding orderer URL', orderer);
            chain.addOrderer(HLFConnectionManager.createOrderer(orderer));
        });

        // Load all of the peers into the client.
        connectOptions.peers.forEach((peer) => {
            LOG.debug(method, 'Adding peer URL', peer);
            chain.addPeer(HLFConnectionManager.createPeer(peer));
        });

        // load and connect to each of the defined event eventHubs
        let eventHubs = [];
        connectOptions.events.forEach((eventHubURL) => {
            const eventHub = HLFConnectionManager.createEventHub();
            LOG.debug(method, 'Setting event hub URL', eventHubURL);
            eventHub.setPeerAddr(eventHubURL);
            eventHub.connect();
            eventHubs.push(eventHub);
        });
        process.on('exit', () => {
            eventHubs.forEach((eventHub) => {
                if (eventHub.isconnected()) {
                    eventHub.disconnect();
                }
            });
        });

        // If a wallet has been specified, then we want to use that.
        let result;
        if (wallet) {
            LOG.debug(method, 'A wallet has been specified, using wallet proxy');
            let store = new HLFWalletProxy(wallet);
            client.setStateStore(store);
            result = Promise.resolve(store);
        } else {

            // No wallet specified, so create a file based key value store.
            LOG.debug(method, 'Using key value store', connectOptions.keyValStore);
            result = Client.newDefaultKeyValueStore({
                path: connectOptions.keyValStore
            })
            .then((store) => {
                client.setStateStore(store);
                return store;
            })
            .catch((error) => {
                LOG.error(method, error);
                throw error;
            });
        }

        return result.then((store) => {

            // Create a CA client.
            const caClient = HLFConnectionManager.createCAClient(connectOptions.ca, {
                path: connectOptions.keyValStore
            });

            // Now we can create the connection.
            let connection = new HLFConnection(this, connectionProfile, businessNetworkIdentifier, connectOptions, client, chain, eventHubs, caClient);
            LOG.exit(method, connection);
            return connection;

        }).catch((error) => {
            LOG.error(method, error);
            throw error;
        });

    }
}

module.exports = HLFConnectionManager;
