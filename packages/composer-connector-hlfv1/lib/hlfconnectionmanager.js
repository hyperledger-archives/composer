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

const composerUtil = require('composer-common').Util;
const Logger = require('composer-common').Logger;
const util = require('util');
const fs = require('fs');
const fsextra = require('fs-extra');
const path = require('path');
const thenifyAll = require('thenify-all');

const LOG = Logger.getLog('HLFConnectionManager');

global.hfc = {
    logger: {
        debug: (text, ...args) => {
            let message = util.format(text, ...args);
            LOG.debug('fabric-client', message);
        },
        info: (text, ...args) => {
            let message = util.format(text, ...args);
            LOG.info('fabric-client', message);
        },
        warn: (text, ...args) => {
            let message = util.format(text, ...args);
            LOG.warn('fabric-client', message);
        },
        error: (text, ...args) => {
            let message = util.format(text, ...args);
            LOG.error('fabric-client', message);
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
        return new Orderer(ordererURL, opts);
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
        }  else if (!wallet && !profileDefinition.keyValStore && !profileDefinition.cardName) {
            throw new Error('No key value store directory, wallet or card name has been specified');
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
     * @param {Object} profileData The connection profile.
     * @returns {Promise} resolves to a client configured with the required stores
     *
     * @memberOf HLFConnectionManager
     */
    _setupClientStore(client, wallet, profileData) {
        const method = '_setupClientStore';
        LOG.entry(method, client, wallet, profileData);

        if (wallet) {
            return this._setupWallet(client, wallet);
        }

        let storePath;
        if (profileData.cardName) {
            storePath = path.join(composerUtil.homeDirectory(), '.composer', 'client-data', profileData.cardName);
        } else {
            storePath = profileData.keyValStore;
        }

        return this._setupFileStore(client, storePath);

    }

    /**
     * Link a wallet to the fabric-client store and cryptostore
     * @param {Client} client the fabric client
     * @param {Wallet} wallet the wallet implementation
     * @returns {Promise} resolves to a client configured with the required stores
     */
    _setupWallet(client, wallet) {
        const method = '_setupWallet';
        LOG.entry(method, client, wallet);
        return new HLFWalletProxy(wallet).then((store) => {
            const cryptostore = Client.newCryptoKeyStore(HLFWalletProxy, wallet);
            client.setStateStore(store);
            const cryptoSuite = Client.newCryptoSuite();
            cryptoSuite.setCryptoKeyStore(cryptostore);
            client.setCryptoSuite(cryptoSuite);
            return store;
        }).catch((error) => {
            LOG.error(method, error);
            const newError = new Error('error trying to setup a wallet. ' + error);
            throw newError;
        });
    }

    /**
     * Configure the Fabric client with a file-based store.
     * @param {Client} client The Fabric client
     * @param {String} keyValStorePath File system location to use for the store
     * @returns {Promise} resolves to a client configured with the required stores
     */
    _setupFileStore(client, keyValStorePath) {
        const method = '_setupFileStore';
        LOG.entry(method, client, keyValStorePath);
        return Client.newDefaultKeyValueStore({path: keyValStorePath}).then((store) => {
            client.setStateStore(store);
            const cryptoSuite = Client.newCryptoSuite();
            cryptoSuite.setCryptoKeyStore(Client.newCryptoKeyStore({path: keyValStorePath}));
            client.setCryptoSuite(cryptoSuite);
            return store;
        })
        .catch((error) => {
            LOG.error(method, error);
            const newError = new Error('error trying to setup a keystore path. ' + error);
            throw newError;
        });
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
            return Promise.reject(Error('connectionProfile not specified or not a string'));
        } else if (!connectionOptions || typeof connectionOptions !== 'object') {
            return Promise.reject(Error('connectionOptions not specified or not an object'));
        } else if (!enrollmentID) {
            return Promise.reject(new Error('enrollmentID not specified'));
        } else if (!enrollmentSecret) {
            return Promise.reject(new Error('enrollmentSecret not specified'));
        } else if (!connectionOptions.ca) {
            return Promise.reject(new Error('No ca defined in connection profile'));
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
        LOG.entry(method, connectionProfile, connectionOptions, id, publicCert);

        // validate arguments
        if (!connectionProfile || typeof connectionProfile !== 'string') {
            return Promise.reject(Error('connectionProfile not specified or not a string'));
        } else if (!connectionOptions || typeof connectionOptions !== 'object') {
            return Promise.reject(new Error('connectionOptions not specified or not an object'));
        } else if (!id || typeof id !== 'string') {
            return Promise.reject(new Error('id not specified or not a string'));
        } else if (!publicCert || typeof publicCert !== 'string') {
            return Promise.reject(new Error('publicCert not specified or not a string'));
        } else if (!privateKey || typeof privateKey !== 'string') {
            return Promise.reject(new Error('privateKey not specified or not a string'));
        }

        //default the optional wallet
        let wallet = connectionOptions.wallet || Wallet.getWallet();

        // validate the profile
        try {
            this.validateProfileDefinition(connectionOptions, wallet);
        } catch(error) {
            return Promise.reject(error);
        }

        let mspID = connectionOptions.mspID;
        const client = HLFConnectionManager.createClient();
        return this._setupClientStore(client, wallet, connectionOptions)
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
            return Promise.reject(new Error('connectionProfile not specified'));
        } else if (!connectOptions) {
            return Promise.reject(new Error('connectOptions not specified'));
        }

        //default the optional wallet
        let wallet = connectOptions.wallet || Wallet.getWallet();

        // validate the profile
        try {
            this.validateProfileDefinition(connectOptions, wallet);
        } catch(error) {
            return Promise.reject(error);
        }

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
        try {
            connectOptions.peers.forEach((peer) => {
                HLFConnectionManager.parsePeer(peer, connectOptions.timeout, connectOptions.globalCert, peers, eventHubDefs);
            });
        } catch(error) {
            return Promise.reject(error);
        }

        // Check for at least one peer and at least one event hub.
        if (peers.length === 0) {
            return Promise.reject(new Error('You must specify at least one peer with a valid requestURL for submitting transactions'));
        } else if (eventHubDefs.length === 0) {
            return Promise.reject(new Error('You must specify at least one peer with a valid eventURL for receiving events'));
        }

        // Load all of the peers into the client.
        peers.forEach((peer) => {
            LOG.debug(method, 'Adding peer URL', peer);
            channel.addPeer(peer);
        });

        // Set up the wallet.
        return this._setupClientStore(client, wallet, connectOptions)
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

    /**
     * Obtain the credentials associated with a given identity.
     * @param {String} connectionProfileName - Name of the connection profile.
     * @param {Object} connectionOptions - connection options loaded from the profile.
     * @param {String} id - Name of the identity.
     * @return {Promise} Resolves to credentials in the form <em>{ certificate: String, privateKey: String }</em>, or
     * {@link null} if the named identity does not exist.
     */
    exportIdentity(connectionProfileName, connectionOptions, id) {
        const method = 'exportIdentity';
        LOG.entry(method, connectionProfileName, connectionOptions, id);
        const client = HLFConnectionManager.createClient();
        return this._setupClientStore(client, connectionOptions.wallet, connectionOptions)
            .then(() => {
                return client.getUserContext(id, true);
            })
            .then((user) => {
                let result = null;
                if (user) {
                    result = {
                        certificate: user.getIdentity()._certificate,
                        privateKey: user.getSigningIdentity()._signer._key.toBytes()
                    };
                }
                LOG.exit(method, result);
                return result;
            });
    }

    /**
     * Remove any cached credentials associated with a given identity.
     * @param {String} connectionProfileName Name of the connection profile.
     * @param {Object} connectionOptions connection options loaded from the profile.
     * @param {String} id Name of the identity.
     * @returns {Promise} a promise which resolves when the identity is imported
     */
    removeIdentity(connectionProfileName, connectionOptions, id) {
        if (!connectionProfileName || typeof connectionProfileName !== 'string') {
            return Promise.reject(Error('connectionProfileName not specified or not a string'));
        } else if (!connectionOptions || typeof connectionOptions !== 'object') {
            return Promise.reject(Error('connectionOptions not specified or not an object'));
        } else if (!id || typeof id !== 'string') {
            return Promise.reject(new Error('id not specified or not a string'));
        }

        // if it's a wallet then we can use the wallet implementation to remove by id
        if (connectionOptions.wallet) {
            let exists;
            return connectionOptions.wallet.contains(id)
                .then((exists_) => {
                    exists = exists_;
                    if (exists) {
                        return connectionOptions.wallet.remove(id);
                    }
                })
                .then(() => {
                    return exists;
                });
        }

        // it's using a file system based on the card name, as the KeyValueStore of the fabric SDK only supports
        // get and set and luckily we isolate the information based on the card name we can just forceably delete the directory.
        // we cannot support doing this for connection profiles that use keyValStore and no cardname provided.
        if (connectionOptions.cardName) {
            let storePath = path.join(composerUtil.homeDirectory(), '.composer', 'client-data', connectionOptions.cardName);
            let exists;

            return HLFConnectionManager._exists(storePath)
                .then((exists_) => {
                    exists = exists_;
                    if (exists) {
                        const thenifyFSExtra = thenifyAll(fsextra);
                        return thenifyFSExtra.remove(storePath);
                    }
                })
                .then(() => {
                    return exists;
                });


        } else {
            return Promise.reject(new Error('Unable to remove identity as no card name provided'));
        }
    }

    /**
     * Determine if a path exists.
     * @param {string} storePath the path to check
     * @return {promise} resolves to true if it exists or false otherwise.
     */
    static _exists(storePath) {
        const thenifyFS = thenifyAll(fs);
        return thenifyFS.stat(storePath)
            .then(() => {
                return true;
            })
            .catch(() => {
                return false;
            });
    }
}

module.exports = HLFConnectionManager;
