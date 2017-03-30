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
const fs = require('fs');

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
     * @param {string} ordererURL The orderer URL string or the orderer object definition
     * @param {object} tlsOpts optional tls options
     * @return {Orderer} A new orderer.
     */
    static createOrderer(ordererURL, tlsOpts) {
        return new Orderer(ordererURL, tlsOpts);
    }

    /**
     * parse the orderer definition
     * @param {string|object} orderer The orderer definition
     * @return {Orderer} A new orderer.
     */
    static parseOrderer(orderer) {
        if (typeof orderer === 'object') {
            const opts = HLFConnectionManager._createOpts(orderer.cert, orderer.hostnameOverride);
            return HLFConnectionManager.createOrderer(orderer.url, opts);
        }
        return HLFConnectionManager.createOrderer(orderer);
    }

    /**
     * create tls options for fabric-client
     * @static
     * @private
     * @param {string} cert the certificate in PEM format
     * @param {string} override hostname override required for tests
     * @returns {object} tls options
     */
    static _createOpts(cert, override) {
        if (!cert) {
            return undefined;
        }
        let embeddedCert;
        if (cert.match('^-----BEGIN CERTIFICATE-----')) {
            embeddedCert = cert;
        } else {
            // assume a file path for now but should support a url mechanism
            let data = fs.readFileSync(cert);
            embeddedCert = Buffer.from(data).toString();
        }

        let opts = {
            pem: embeddedCert
        };
        if (override) {
            opts['ssl-target-name-override'] = override;
        }
        return opts;
    }

    /**
     * create a new peer
     * @static
     * @param {string} peerURL The peer URL.
     * @param {object} tlsOpts the tls options
     * @returns {Peer} A new Peer
     * @memberOf HLFConnectionManager
     */
    static createPeer(peerURL, tlsOpts) {
        return new Peer(peerURL, tlsOpts);
    }

    /**
     * parse the peer definition in a connection
     * @param {string} peer The peer URL.
     * @param {array} eventHubs Array to store any created event hubs
     * @return {Peer} A new peer.
     */
    static parsePeer(peer, eventHubs) {
        const method = 'parsePeer';

        const tlsOpts = HLFConnectionManager._createOpts(peer.cert, peer.hostnameOverride);
        if (!peer.requestURL && !peer.eventURL) {
            throw new Error('peer incorrectly defined');
        }
        if (peer.requestURL && !peer.eventURL) {
            throw new Error(`The peer at requestURL ${peer.requestURL} has no eventURL defined`);
        }
        if (!peer.requestURL && peer.eventURL) {
            throw new Error(`The peer at eventURL ${peer.eventURL} has no requestURL defined`);
        }

        const hfc_peer = HLFConnectionManager.createPeer(peer.requestURL, tlsOpts);
        // load and connect to the event hub
        const eventHub = HLFConnectionManager.createEventHub();
        LOG.debug(method, 'Setting event hub URL', peer.eventURL);
        eventHub.setPeerAddr(peer.eventURL, tlsOpts);
        eventHub.connect();
        eventHubs.push(eventHub);
        return hfc_peer;
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
     * @param {string} caURL The CA URL.
     * @param {object} tlsOpts the tls options
     * @param {KeyValStore} keyValStore The key value store.
     * @return {FabricCAClientImpl} A new CA client.
     */
    static createCAClient(caURL, tlsOpts, keyValStore) {
        return new FabricCAClientImpl(caURL, tlsOpts, {'path': keyValStore});
    }

    /**
     * Create a new CA client from a ca definition
     * @param {string|object} ca The CA object or string
     * @param {KeyValStore} keyValStore The key value store.
     * @return {FabricCAClientImpl} A new CA client.
     */
    static parseCA(ca, keyValStore) {
        let tlsOpts = null;
        if (typeof ca === 'object') {
            if (ca.trustedRoots) {
                tlsOpts = {
                    trustedRoots: ca.trustedRoots,
                    verify: ca.verify  // undefined gets set to true by client
                };
            }
            return HLFConnectionManager.createCAClient(ca.url, tlsOpts, keyValStore);
        }
        return HLFConnectionManager.createCAClient(ca, null, keyValStore);
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
        let wallet = connectOptions.wallet || Wallet.getWallet();
        if (!Array.isArray(connectOptions.orderers)) {
            throw new Error('The orderers array has not been specified in the connection profile');
        } else if (!connectOptions.orderers.length) {
            throw new Error('No orderer URLs have been specified in the connection profile');
        } else if (!Array.isArray(connectOptions.peers)) {
            throw new Error('The peers array has not been specified in the connection profile');
        } else if (!connectOptions.peers.length) {
            throw new Error('No peer URLs have been specified in the connection profile');
        }  else if (!wallet && !connectOptions.keyValStore) {
            throw new Error('No key value store directory has been specified');
        } else if (!connectOptions.ca) {
            throw new Error('The certificate authority URL has not been specified in the connection profile');
        } else if (!connectOptions.channel) {
            throw new Error('No channel has been specified in the connection profile');
        } else if (!connectOptions.mspID) {
            throw new Error('No msp id defined');
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
            chain.addOrderer(HLFConnectionManager.parseOrderer(orderer));
        });

        let eventHubs = [];
        // Load all of the peers into the client.
        connectOptions.peers.forEach((peer) => {
            LOG.debug(method, 'Adding peer URL', peer);
            chain.addPeer(HLFConnectionManager.parsePeer(peer, eventHubs));
        });

        // register to disconnect on exit for all event hubs
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
            const caClient = HLFConnectionManager.parseCA(connectOptions.ca, connectOptions.keyValStore);

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
