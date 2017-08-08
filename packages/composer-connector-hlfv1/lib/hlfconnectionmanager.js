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
     * @param {array} peers Array to store any created peers
     * @param {array} eventHubDefs Array to store any created event hubs
     */
    static parsePeer(peer, timeout, globalCert, peers, eventHubDefs) {
        const method = 'parsePeer';

        const opts = HLFConnectionManager._createOpts(timeout, peer.cert, peer.hostnameOverride, globalCert);
        if (!peer.requestURL && !peer.eventURL) {
            throw new Error('peer incorrectly defined');
        }

        if (peer.requestURL) {
            const hfc_peer = HLFConnectionManager.createPeer(peer.requestURL, opts);
            LOG.debug(method, 'Adding peer URL', peer.requestURL);
            peers.push(hfc_peer);
        }
        if (peer.eventURL) {
            const eventHub = HLFConnectionManager.createEventHubDefinition(peer.eventURL, opts);
            LOG.debug(method, 'Setting event hub URL', peer.eventURL);
            eventHubDefs.push(eventHub);
        }
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
     * Request an identity's certificates.
     *
     * @param {string} connectionProfile The name of the connection profile
     * @param {object} connectionOptions The connection options loaded from the profile
     * @param {any} enrollmentID The enrollment id
     * @param {any} enrollmentSecret  The enrollment secret
     * @returns {promise} resolves once the files have been written, rejected if a problem occurs
     */
    requestIdentity(connectionProfile, connectionOptions, enrollmentID, enrollmentSecret) {
        const method = 'requestIdentity';
        LOG.entry(method, enrollmentID);

        // Validate all the arguments.
        if (!connectionProfile || typeof connectionProfile !== 'string') {
            throw new Error('connectionProfile not specified or not a string');
        } else if (!connectionOptions || typeof connectionOptions !== 'object') {
            throw new Error('connectionOptions not specified or not an object');
        } else if (!enrollmentID) {
            throw new Error('enrollmentID not specified');
        } else if (!enrollmentSecret) {
            throw new Error('enrollmentSecret not specified');
        } else if (!connectionOptions.ca) {
            throw new Error('No ca defined in connection profile');
        }

        // Submit the enrollment request to Fabric CA.
        LOG.debug(method, 'Submitting enrollment request');
        let options = { enrollmentID: enrollmentID, enrollmentSecret: enrollmentSecret };
        const caClient = HLFConnectionManager.parseCA(connectionOptions.ca, Client.newCryptoSuite());

        // determine the name of the ca.
        let caName = 'default';
        if (typeof connectionOptions.ca === 'object' && connectionOptions.ca.name) {
            caName = connectionOptions.ca.name;
        }
        return caClient.enroll(options)
            .then((enrollment) => {
                enrollment.caName = caName;
                enrollment.key = enrollment.key.toBytes();
                LOG.exit(method);
                return enrollment;
            })
            .catch((error) => {
                const newError = new Error('Error trying to enroll user and return certificates. ' + error);
                LOG.error(method, newError);
                throw newError;
            });

    }

    /**
     * Import an identity into a profile wallet or keystore
     *
     * @param {string} connectionProfile The name of the connection profile
     * @param {object} connectionOptions The connection options loaded from the profile
     * @param {string} id the id to associate with the identity
     * @param {string} publicCert the public signer certificate
     * @param {string} privateKey the private key
     * @returns {Promise} a promise
     */
    importIdentity(connectionProfile, connectionOptions, id, publicCert, privateKey) {
        const method = 'importIdentity';
        LOG.entry(method, connectionProfile, connectionOptions, id, publicCert, privateKey);

        // validate arguments
        if (!connectionProfile || typeof connectionProfile !== 'string') {
            throw new Error('connectionProfile not specified or not a string');
        } else if (!connectionOptions || typeof connectionOptions !== 'object') {
            throw new Error('connectionOptions not specified or not an object');
        } else if (!id || typeof id !== 'string') {
            throw new Error('id not specified or not a string');
        } else if (!publicCert || typeof publicCert !== 'string') {
            throw new Error('publicCert not specified or not a string');
        } else if (!privateKey || typeof privateKey !== 'string') {
            throw new Error('privateKey not specified or not a string');
        }

        //default the optional wallet
        let wallet = connectionOptions.wallet || Wallet.getWallet();

        // validate the profile
        this.validateProfileDefinition(connectionOptions, wallet);

        let mspID = connectionOptions.mspID;
        const client = HLFConnectionManager.createClient();
        return this._setupWallet(client, wallet, connectionOptions.keyValStore)
            .then(() => {
                return client.createUser({
                    username: id,
                    mspid: mspID,
                    cryptoContent: {
                        privateKeyPEM: privateKey,
                        signedCertPEM: publicCert
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
        if (connectOptions.maxSendSize && connectOptions.maxSendSize !== 0) {
            Client.setConfigSetting('grpc-max-send-message-length', connectOptions.maxSendSize * 1 < 0 ? -1 : 1024 * 1024 * connectOptions.maxSendSize);
        }

        // set the message limits if required
        if (connectOptions.maxRecvSize && connectOptions.maxRecvSize !== 0) {
            Client.setConfigSetting('grpc-max-receive-message-length', connectOptions.maxRecvSize * 1 < 0 ? -1 : 1024 * 1024 * connectOptions.maxRecvSize);
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

        // Parse all of the peers.
        let peers = [];
        let eventHubDefs = [];
        connectOptions.peers.forEach((peer) => {
            HLFConnectionManager.parsePeer(peer, connectOptions.timeout, connectOptions.globalCert, peers, eventHubDefs);
        });

        // Check for at least one peer and at least one event hub.
        if (peers.length === 0) {
            throw new Error('You must specify at least one peer with a valid requestURL for submitting transactions');
        } else if (eventHubDefs.length === 0) {
            throw new Error('You must specify at least one peer with a valid eventURL for receiving events');
        }

        // Load all of the peers into the client.
        peers.forEach((peer) => {
            LOG.debug(method, 'Adding peer URL', peer);
            channel.addPeer(peer);
        });

        // Set up the wallet.
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
