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
     * @param {object} connectOptions connect options
     * @return {Client} A new client.
     */
    static createClient(connectOptions) {
        let client;
        try {
            client = Client.loadFromConfig(connectOptions);
        } catch(err) {
            let newError = new Error('Failed to create client from connection profile. ' + err);
            throw newError;
        }
        return client;
    }

    /**
     * Create a new HLF Connection.
     *
     * @static
     * @param {HLFConnectionManager} connectionManager this connection manager creating the connection
     * @param {string} connectionProfile the name of the connection profile
     * @param {string} businessNetworkIdentifier the name of the business network identifier or null if there isn't one
     * @param {any} connectOptions the connection profile itself in case of any further connection specific options
     * @param {Client} client the node sdk client
     * @param {Channel} channel the node sdk channel to be used created from the profile
     * @param {FabricCAClientImpl} caClient the node sdk ca lient created from the profile
     * @returns {HLFConnection} connection

     */
    static createHLFConnection(connectionManager, connectionProfile, businessNetworkIdentifier, connectOptions, client, channel, caClient) {
        return new HLFConnection(connectionManager, connectionProfile, businessNetworkIdentifier, connectOptions, client, channel, caClient);
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
     * link a wallet to the fabric-client store and cryptostore
     * or use the fabric-clients default FileKeyValStore if no
     * wallet specified.
     *
     * @param {Client} client the fabric-client
     * @param {Wallet} wallet the wallet implementation or null/undefined
     * @param {Object} profileData The connection profile.
     * @returns {Promise} resolves to a client configured with the required stores
     *
     */
    static _setupClientStore(client, wallet, profileData) {
        const method = '_setupClientStore';
        LOG.entry(method, client, wallet, profileData);

        if (wallet) {
            return this._setupWallet(client, wallet);
        }

        let storePath = path.join(composerUtil.homeDirectory(), '.composer', 'client-data', profileData.cardName);

        return HLFConnectionManager._setupFileStore(client, storePath);

    }

    /**
     * Link a wallet to the fabric-client store and cryptostore
     * @param {Client} client the fabric client
     * @param {Wallet} wallet the wallet implementation
     * @returns {Promise} resolves to a client configured with the required stores
     */
    static _setupWallet(client, wallet) {
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
    static _setupFileStore(client, keyValStorePath) {
        //TODO: could we use client.initCredentialStores() ?
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
        }

        // Submit the enrollment request to Fabric CA.
        LOG.debug(method, 'Submitting enrollment request');
        let options = { enrollmentID: enrollmentID, enrollmentSecret: enrollmentSecret };
        const client = HLFConnectionManager.createClient(connectionOptions);
        const caClient = client.getCertificateAuthority();

        let caName = caClient.getCaName();
        caName = caName ? caName : 'default';
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

        if (!wallet && !connectionOptions.cardName) {
            return Promise.reject(new Error('No wallet or card name has been specified'));
        }

        let client = HLFConnectionManager.createClient(connectionOptions);
        const mspID = client.getMspid();
        //TODO check if mspId, organisation is defined
        return HLFConnectionManager._setupClientStore(client, wallet, connectionOptions)
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
     * @param {string} businessNetworkIdentifier The identifier of the business network (no version!), can be null if not connecting to a business network
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

        if (!wallet && !connectOptions.cardName) {
            return Promise.reject(new Error('No wallet or card name has been specified'));
        }

        // Create a new client instance.
        const client = HLFConnectionManager.createClient(connectOptions);

        // TODO: check mspId and organisation have been defined
        // TODO: find a channel, should be provided by node sdk
        let channelNames = Object.keys(client._network_config._network_config.channels);
        const channel = client.getChannel(channelNames[0]);

        return HLFConnectionManager._setupClientStore(client, wallet, connectOptions)
            .then(() => {

                // Create a CA client.
                const caClient = client.getCertificateAuthority();

                // Now we can create the connection.
                let connection = HLFConnectionManager.createHLFConnection(this, connectionProfile, businessNetworkIdentifier, connectOptions, client, channel, caClient);
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

        //default the optional wallet
        let wallet = connectionOptions.wallet || Wallet.getWallet();

        const client = HLFConnectionManager.createClient(connectionOptions);
        return HLFConnectionManager._setupClientStore(client, wallet, connectionOptions)
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
