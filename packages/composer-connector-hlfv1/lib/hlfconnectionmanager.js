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
     * @param {object} ccp The Common Connection Profile
     * @param {boolean} [setupStore] true if a store is required to be setup
     * @param {Wallet} [wallet] the wallet to use for the store
     * @return {Promise} A promise which resolves to a client or rejects if an error occurs
     */
    static async createClient(ccp, setupStore) {

        let client;
        let wallet;
        try {
            if (setupStore) {
                wallet = ccp.wallet || Wallet.getWallet();

                if (!wallet && !ccp.cardName) {
                    return Promise.reject(new Error('No wallet or card name has been specified'));
                }

                if (!wallet) {
                    let storePath = path.join(composerUtil.homeDirectory(), '.composer', 'client-data', ccp.cardName);
                    ccp.client.credentialStore = {
                        'path': storePath,
                        'cryptoStore': {
                            'path': storePath
                        }
                    };
                }
            }
            client = Client.loadFromConfig(ccp);
            if (setupStore) {
                if (wallet) {
                    await HLFConnectionManager.setupWallet(client, wallet);
                } else {
                    await client.initCredentialStores();
                }
            }
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
     * Link a wallet to the fabric-client store and cryptostore
     * @param {Client} client the fabric client
     * @param {Wallet} wallet the wallet implementation
     */
    static async setupWallet(client, wallet) {
        const method = 'setupWallet';
        LOG.entry(method, client, wallet);
        try {
            let store = await new HLFWalletProxy(wallet);
            client.setStateStore(store);

            const cryptostore = Client.newCryptoKeyStore(HLFWalletProxy, wallet);
            const cryptoSuite = Client.newCryptoSuite();
            cryptoSuite.setCryptoKeyStore(cryptostore);
            client.setCryptoSuite(cryptoSuite);
            LOG.exit(method);
        } catch (error) {
            LOG.error(method, error);
            const newError = new Error('Error trying to setup a wallet. ' + error);
            throw newError;
        }
    }

    /**
     * Configure the Fabric client with a file-based store.
     * @param {Client} client The Fabric client
     * @param {String} keyValStorePath File system location to use for the store
     * @returns {Promise} resolves to a client configured with the required stores
     */
    /*
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
    */

    /**
     * Request an identity's certificates.
     *
     * @param {string} connectionProfile The name of the connection profile
     * @param {object} connectionOptions The connection options loaded from the profile
     * @param {any} enrollmentID The enrollment id
     * @param {any} enrollmentSecret  The enrollment secret
     * @returns {promise} resolves once the files have been written, rejected if a problem occurs
     */
    async requestIdentity(connectionProfile, connectionOptions, enrollmentID, enrollmentSecret) {
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
        }

        // Submit the enrollment request to Fabric CA.
        LOG.debug(method, 'Submitting enrollment request');
        let options = { enrollmentID: enrollmentID, enrollmentSecret: enrollmentSecret };
        const client = await HLFConnectionManager.createClient(connectionOptions, false);
        const caClient = client.getCertificateAuthority();

        let caName = caClient.getCaName();
        caName = caName ? caName : 'default';
        try {
            let enrollment = await caClient.enroll(options);
            enrollment.caName = caName;
            enrollment.key = enrollment.key.toBytes();
            LOG.exit(method);
            return enrollment;
        } catch (error) {
            const newError = new Error('Error trying to enroll user and return certificates. ' + error);
            LOG.error(method, newError);
            throw newError;
        }
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
    async importIdentity(connectionProfile, connectionOptions, id, publicCert, privateKey) {
        const method = 'importIdentity';
        LOG.entry(method, connectionProfile, connectionOptions, id, publicCert);

        // validate arguments
        if (!connectionProfile || typeof connectionProfile !== 'string') {
            throw new Error('connectionProfile not specified or not a string');
        } else if (!connectionOptions || typeof connectionOptions !== 'object') {
            throw new Error('connectionOptions not specified or not an object');
        } else if (!id || typeof id !== 'string') {
            return Promise.reject(new Error('id not specified or not a string'));
        } else if (!publicCert || typeof publicCert !== 'string') {
            return Promise.reject(new Error('publicCert not specified or not a string'));
        } else if (!privateKey || typeof privateKey !== 'string') {
            return Promise.reject(new Error('privateKey not specified or not a string'));
        }

        //default the optional wallet

        //TODO check if mspId, organisation is defined ? need to test nodesdk to see what it does
        let client = await HLFConnectionManager.createClient(connectionOptions, true);
        const mspID = client.getMspid();

        try {
            await client.createUser(
                {
                    username: id,
                    mspid: mspID,
                    cryptoContent: {
                        privateKeyPEM: privateKey,
                        signedCertPEM: publicCert
                    }
                });
            LOG.exit(method);
        } catch (error) {
            let newError = `Failed to import identity. ${error}`;
            LOG.error(method, newError);
            throw newError;
        }
    }

    /**
     * Establish a connection to the business network.
     * @param {string} connectionProfile The name of the connection profile
     * @param {string} businessNetworkIdentifier The identifier of the business network (no version!), can be null if not connecting to a business network
     * @param {object} connectOptions The connection options loaded from the profile
     * @return {Promise} A promise that is resolved with a {@link Connection}
     * object once the connection is established, or rejected with a connection error.
     */
    async connect(connectionProfile, businessNetworkIdentifier, connectOptions) {
        const method = 'connect';
        LOG.entry(method, connectionProfile, businessNetworkIdentifier, connectOptions);

        // Validate all the arguments.
        if (!connectionProfile) {
            throw new Error('connectionProfile not specified');
        } else if (!connectOptions) {
            throw new Error('connectOptions not specified');
        }

        // Create a new client instance.
        const client = await HLFConnectionManager.createClient(connectOptions, true);

        // TODO: check mspId and organisation have been defined node-sdk should handle nicely
        // TODO: find a channel, should be provided by node sdk
        let channelNames = Object.keys(client._network_config._network_config.channels);
        const channel = client.getChannel(channelNames[0]);
        // Create a CA client.
        const caClient = client.getCertificateAuthority();

        // Now we can create the connection.
        let connection = HLFConnectionManager.createHLFConnection(this, connectionProfile, businessNetworkIdentifier, connectOptions, client, channel, caClient);
        LOG.exit(method, connection);
        return connection;
    }

    /**
     * Obtain the credentials associated with a given identity.
     * @param {String} connectionProfileName - Name of the connection profile.
     * @param {Object} connectionOptions - connection options loaded from the profile.
     * @param {String} id - Name of the identity.
     * @return {Promise} Resolves to credentials in the form <em>{ certificate: String, privateKey: String }</em>, or
     * {@link null} if the named identity does not exist.
     */
    async exportIdentity(connectionProfileName, connectionOptions, id) {
        const method = 'exportIdentity';
        LOG.entry(method, connectionProfileName, connectionOptions, id);

        const client = await HLFConnectionManager.createClient(connectionOptions, true);
        const user = await client.getUserContext(id, true);
        let result = null;
        if (user) {
            result = {
                certificate: user.getIdentity()._certificate,
                privateKey: user.getSigningIdentity()._signer._key.toBytes()
            };
        }
        LOG.exit(method, result);
        return result;
    }

    /**
     * Remove any cached credentials associated with a given identity.
     * @param {String} connectionProfileName Name of the connection profile.
     * @param {Object} connectionOptions connection options loaded from the profile.
     * @param {String} id Name of the identity.
     * @returns {Promise} a promise which resolves when the identity is imported
     */
    async removeIdentity(connectionProfileName, connectionOptions, id) {
        if (!connectionProfileName || typeof connectionProfileName !== 'string') {
            throw new Error('connectionProfileName not specified or not a string');
        } else if (!connectionOptions || typeof connectionOptions !== 'object') {
            throw new Error('connectionOptions not specified or not an object');
        } else if (!id || typeof id !== 'string') {
            throw new Error('id not specified or not a string');
        }

        // if it's a wallet then we can use the wallet implementation to remove by id
        if (connectionOptions.wallet) {
            let exists = await connectionOptions.wallet.contains(id);
            if (exists) {
                await connectionOptions.wallet.remove(id);
            }
            return exists;
        }

        // it's using a file system based on the card name, as the KeyValueStore of the fabric SDK only supports
        // get and set and luckily we isolate the information based on the card name we can just forceably delete the directory.
        // we cannot support doing this for connection profiles that use keyValStore and no cardname provided.
        if (connectionOptions.cardName) {
            let storePath = path.join(composerUtil.homeDirectory(), '.composer', 'client-data', connectionOptions.cardName);
            let exists = await HLFConnectionManager._exists(storePath);
            if (exists) {
                const thenifyFSExtra = thenifyAll(fsextra);
                await thenifyFSExtra.remove(storePath);
            }
            return exists;

        } else {
            return Promise.reject(new Error('Unable to remove identity as no card name provided'));
        }
    }

    /**
     * Determine if a path exists.
     * @param {string} storePath the path to check
     * @return {promise} resolves to true if it exists or false otherwise.
     */
    static async _exists(storePath) {
        const thenifyFS = thenifyAll(fs);
        try {
            await thenifyFS.stat(storePath);
            return true;
        } catch(err) {
            return false;
        }
    }
}

module.exports = HLFConnectionManager;
