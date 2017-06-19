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
const FabricCAClientImpl = require('fabric-ca-client');
const Orderer = require('fabric-client/lib/Orderer');
const Peer = require('fabric-client/lib/Peer');

const ConnectionManager = require('composer-common').ConnectionManager;
const HLFConnection = require('./hlfconnection');
const HLFWalletProxy = require('./hlfwalletproxy');
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
     * @param {object} opts optional tls options
     * @return {Orderer} A new orderer.
     */
    static createOrderer(ordererURL, opts) {
        return new Orderer(ordererURL, opts);  //TODO: Change this
    }

    /**
     * parse the orderer definition
     * @param {string|object} orderer The orderer definition
     * @param {number} timeout the request
     * @param {string} globalCert if provided use this unless cert is provided
     * @return {Orderer} A new orderer.
     */
    static parseOrderer(orderer, timeout, globalCert) {
        if (typeof orderer === 'object') {
            const opts = HLFConnectionManager._createOpts(timeout, orderer.cert, orderer.hostnameOverride, globalCert);
            return HLFConnectionManager.createOrderer(orderer.url, opts);
        }
        return HLFConnectionManager.createOrderer(orderer, HLFConnectionManager._createOpts(timeout, null, null, globalCert));
    }

    /**
     * create options for fabric-client
     * @static
     * @private
     * @param {number} timeout timeout for requests
     * @param {string} cert the certificate in PEM format
     * @param {string} override hostname override required for tests
     * @param {string} globalCert if provided use this unless cert is provided
     * @returns {object} options
     */
    static _createOpts(timeout, cert, override, globalCert) {
        let opts = {
            'request-timeout': timeout * 1000
        };
        if (override) {
            opts['ssl-target-name-override'] = override;
        }

        if (!cert && !globalCert) {
            return opts;
        }
        let finalCert = globalCert;
        if (cert) {
            finalCert = cert;
        }

        if (finalCert.match('^-----BEGIN CERTIFICATE-----')) {
            opts.pem = finalCert;
        } else {
            // assume a file path for now but should support a url mechanism
            let data = fs.readFileSync(finalCert);
            opts.pem = Buffer.from(data).toString();
        }
        return opts;
    }

    /**
     * create a new peer
     * @static
     * @param {string} peerURL The peer URL.
     * @param {object} opts the tls and other options
     * @returns {Peer} A new Peer
     * @memberOf HLFConnectionManager
     */
    static createPeer(peerURL, opts) {
        return new Peer(peerURL, opts);
    }

    /**
     * parse the peer definition in a connection
     * @param {string} peer The peer URL.
     * @param {number} timeout the request timeout
     * @param {string} globalCert if provided use this unless cert is provided
     * @param {array} eventHubDefs Array to store any created event hubs
     * @return {Peer} A new peer.
     */
    static parsePeer(peer, timeout, globalCert, eventHubDefs) {
        const method = 'parsePeer';

        const opts = HLFConnectionManager._createOpts(timeout, peer.cert, peer.hostnameOverride, globalCert);
        if (!peer.requestURL && !peer.eventURL) {
            throw new Error('peer incorrectly defined');
        }
        if (peer.requestURL && !peer.eventURL) {
            throw new Error(`The peer at requestURL ${peer.requestURL} has no eventURL defined`);
        }
        if (!peer.requestURL && peer.eventURL) {
            throw new Error(`The peer at eventURL ${peer.eventURL} has no requestURL defined`);
        }

        const hfc_peer = HLFConnectionManager.createPeer(peer.requestURL, opts);
        // extract and save event hub definitions for later.
        const eventHub = HLFConnectionManager.createEventHubDefinition(peer.eventURL, opts);
        LOG.debug(method, 'Setting event hub URL', peer.eventURL);
        eventHubDefs.push(eventHub);
        return hfc_peer;
    }

    /**
     * create an eventhub definition which can be used to instantiate an event hub later.
     * @static
     * @param {any} eventURL the event hub url
     * @param {any} opts options for the event hub
     * @returns {object} event hub definition
     * @memberOf HLFConnectionManager
     */
    static createEventHubDefinition(eventURL, opts) {
        return {
            'eventURL': eventURL,
            'opts': opts
        };
    }

    /**
     * Create a new CA client.
     * @param {string} caURL The CA URL.
     * @param {object} tlsOpts the tls options
     * @param {string} caName The name of the CA
     * @param {any} cryptosuite The cryptosuite to use
     * @return {FabricCAClientImpl} A new CA client.
     */
    static createCAClient(caURL, tlsOpts, caName, cryptosuite) {
        return new FabricCAClientImpl(caURL, tlsOpts, caName, cryptosuite);
    }

    /**
     * Create a new CA client from a ca definition
     * @param {string|object} ca The CA object or string
     * @param {any} cryptosuite The cryptosuite to assign to the fabric-ca
     * @return {FabricCAClientImpl} A new CA client.
     */
    static parseCA(ca, cryptosuite) {
        let tlsOpts = null;
        if (typeof ca === 'object') {
            if (ca.trustedRoots) {
                tlsOpts = {
                    trustedRoots: ca.trustedRoots,
                    verify: ca.verify  // undefined gets set to true by client
                };
            }
            return HLFConnectionManager.createCAClient(ca.url, tlsOpts, (ca.name || null), cryptosuite);
        }
        return HLFConnectionManager.createCAClient(ca, null, null, cryptosuite);
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
     * Validate the profile
     *
     * @param {object} profileDefinition profile definition
     * @param {wallet} wallet an optional wallet
     *
     * @memberOf HLFConnectionManager
     */
    validateProfileDefinition(profileDefinition, wallet) {
        if (!Array.isArray(profileDefinition.orderers)) {
            throw new Error('The orderers array has not been specified in the connection profile');
        } else if (!profileDefinition.orderers.length) {
            throw new Error('No orderer URLs have been specified in the connection profile');
        } else if (!Array.isArray(profileDefinition.peers)) {
            throw new Error('The peers array has not been specified in the connection profile');
        } else if (!profileDefinition.peers.length) {
            throw new Error('No peer URLs have been specified in the connection profile');
        }  else if (!wallet && !profileDefinition.keyValStore) {
            throw new Error('No key value store directory or wallet has been specified');
        } else if (!profileDefinition.ca) {
            throw new Error('The certificate authority URL has not been specified in the connection profile');
        } else if (!profileDefinition.channel) {
            throw new Error('No channel has been specified in the connection profile');
        } else if (!profileDefinition.mspID) {
            throw new Error('No msp id defined');
        }
    }

    /**
     * link a wallet to the fabric-client store and cryptostore
     * or use the fabric-clients default FileKeyValStore if no
     * wallet specified.
     *
     * @param {Client} client the fabric-client
     * @param {Wallet} wallet the wallet implementation or null/undefined
     * @param {string} keyValStorePath a path for the fileKeyValStore to use or null/undefined if a wallet specified.
     * @returns {Promise} resolves to a client configured with the required stores
     *
     * @memberOf HLFConnectionManager
     */
    _setupWallet(client, wallet, keyValStorePath) {
        const method = '_setupWallet';
        // If a wallet has been specified, then we want to use that.
        //let result;
        LOG.entry(method, client, wallet, keyValStorePath);

        if (wallet) {
            LOG.debug(method, 'A wallet has been specified, using wallet proxy');
            return new HLFWalletProxy(wallet)
                .then((store) => {
                    let cryptostore = Client.newCryptoKeyStore(HLFWalletProxy, wallet);
                    client.setStateStore(store);
                    let cryptoSuite = Client.newCryptoSuite();
                    cryptoSuite.setCryptoKeyStore(cryptostore);
                    client.setCryptoSuite(cryptoSuite);
                    return store;
                })
                .catch((error) => {
                    LOG.error(method, error);
                    let newError = new Error('error trying to setup a wallet. ' + error);
                    throw newError;
                });

        } else {
            // No wallet specified, so create a file based key value store.
            LOG.debug(method, 'Using key value store', keyValStorePath);
            return Client.newDefaultKeyValueStore({path: keyValStorePath})
                .then((store) => {
                    client.setStateStore(store);

                    let cryptoSuite = Client.newCryptoSuite();
                    cryptoSuite.setCryptoKeyStore(Client.newCryptoKeyStore({path: keyValStorePath}));
                    client.setCryptoSuite(cryptoSuite);

                    return store;
                })
                .catch((error) => {
                    LOG.error(method, error);
                    let newError = new Error('error trying to setup a keystore path. ' + error);
                    throw newError;
                });
        }
    }

    /**
     * Import an identity into a profile wallet or keystore
     *
     * @param {object} profileDefinition the profile definition
     * @param {string} id the id to associate with the identity
     * @param {string} publicKey the public key
     * @param {string} privateKey the private key
     * @returns {Promise} a promise
     *
     * @memberOf HLFConnectionManager
     */
    importIdentity(profileDefinition, id, publicKey, privateKey) {
        const method = 'importIdentity';
        LOG.entry(method, profileDefinition, id, publicKey, privateKey);

        // validate arguments
        if (!profileDefinition || typeof profileDefinition !== 'object') {
            throw new Error('profileDefinition not specified or not an object');
        } else if (!id || typeof id !== 'string') {
            throw new Error('id not specified or not a string');
        } else if (!publicKey || typeof publicKey !== 'string') {
            throw new Error('publicKey not specified or not a string');
        } else if (!privateKey || typeof privateKey !== 'string') {
            throw new Error('privateKey not specified or not a string');
        }

        //default the optional wallet
        let wallet = profileDefinition.wallet || Wallet.getWallet();

        // validate the profile
        this.validateProfileDefinition(profileDefinition, wallet);

        let mspID = profileDefinition.mspID;
        const client = HLFConnectionManager.createClient();
        return this._setupWallet(client, wallet, profileDefinition.keyValStore)
            .then(() => {
                return client.createUser({
                    username: id,
                    mspid: mspID,
                    cryptoContent: {
                        privateKeyPEM: privateKey,
                        signedCertPEM: publicKey
                    }
                });
            })
            .then(() => {
                LOG.exit(method);
            })
            .catch((error) => {
                LOG.error(method, error);
                throw error;
            });
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

        //default the optional wallet
        let wallet = connectOptions.wallet || Wallet.getWallet();

        // validate the profile
        this.validateProfileDefinition(connectOptions, wallet);


        // Default the optional connection options.
        if (!connectOptions.timeout) {
            connectOptions.timeout = 180;
        }

        // set the message limits if required
        if (connectOptions.maxSendSize && typeof connectOptions.maxSendSize === 'number' && connectOptions.maxSendSize !== 0) {
            Client.setConfigSetting('grpc-max-send-message-length', connectOptions.maxSendSize < 0 ? -1 : 1024 * 1024 * connectOptions.maxSendSize);
        }

        // set the message limits if required
        if (connectOptions.maxRecvSize && typeof connectOptions.maxRecvSize === 'number' && connectOptions.maxRecvSize !== 0) {
            Client.setConfigSetting('grpc-max-receive-message-length', connectOptions.maxRecvSize < 0 ? -1 : 1024 * 1024 * connectOptions.maxRecvSize);
        }

        // Create a new client instance.
        const client = HLFConnectionManager.createClient();

        // Create a new channel instance.
        const channel = client.newChannel(connectOptions.channel);

        // Load all of the orderers into the client.
        connectOptions.orderers.forEach((orderer) => {
            LOG.debug(method, 'Adding orderer URL', orderer);
            channel.addOrderer(HLFConnectionManager.parseOrderer(orderer, connectOptions.timeout, connectOptions.globalCert));
        });

        let eventHubDefs = [];
        // Load all of the peers into the client.
        connectOptions.peers.forEach((peer) => {
            LOG.debug(method, 'Adding peer URL', peer);
            channel.addPeer(HLFConnectionManager.parsePeer(peer, connectOptions.timeout, connectOptions.globalCert, eventHubDefs));
        });

        return this._setupWallet(client, wallet, connectOptions.keyValStore)
            .then(() => {

                // Create a CA client.
                const caClient = HLFConnectionManager.parseCA(connectOptions.ca, client.getCryptoSuite());

                // Now we can create the connection.
                let connection = new HLFConnection(this, connectionProfile, businessNetworkIdentifier, connectOptions, client, channel, eventHubDefs, caClient);
                LOG.exit(method, connection);
                return connection;

            })
            .catch((error) => {
                LOG.error(method, error);
                throw error;
            });
    }
}

module.exports = HLFConnectionManager;
