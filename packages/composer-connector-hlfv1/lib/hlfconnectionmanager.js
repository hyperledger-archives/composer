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
const jsrsa = require('jsrsasign');
const KEYUTIL = jsrsa.KEYUTIL;
const ecdsaKey = require('fabric-client/lib/impl/ecdsa/key.js');

const cloneDeep = require('lodash').cloneDeep;
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

let HSMSuite = new Map();

/**
 * Class representing a connection manager that establishes and manages
 * connections to one or more business networks running on Hyperledger Fabric,
 * using the fabric-client module.
 * @private
 */
class HLFConnectionManager extends ConnectionManager {

    /**
     * Clear the HSM cache
     */
    static clearHSMCache() {
        HSMSuite.clear();
    }

    /**
     * Determine if we should be using HSM or not
     * @param {object} ccp The common connection profile
     * @return {boolean} true if to use HSM
     */
    static useHSM(ccp) {
        const method = 'useHSM';
        LOG.entry(method);

        if (!ccp.client) {
            return false;
        }
        LOG.debug(method, 'client-section:', ccp.client);
        const hsmConfig = ccp.client['x-hsm'];
        let useHSM = false;
        if (hsmConfig && hsmConfig.library && hsmConfig.library.trim().length !== 0 && hsmConfig.pin && hsmConfig.slot !== null && hsmConfig.slot !== undefined) {
            useHSM = true;
        }

        LOG.exit(method, useHSM);
        return useHSM;
    }


    /**
     * Get a store location based on the cardname. If there is no card name then this means it is
     * an identity request on HSM and we return some dummy location.
     * @param {object} ccp The common connection profile
     * @return {path} a path to use
     */
    static getStoreLocation(ccp) {
        const method = 'getStoreLocation';
        LOG.entry(method, ccp.cardName);
        let pathToUse;
        if (ccp.cardName) {
            pathToUse = path.join(composerUtil.homeDirectory(), '.composer', 'client-data', ccp.cardName);
        } else {
            pathToUse = path.join(composerUtil.homeDirectory(), '.composer', 'temp', 'transient');
        }

        LOG.exit(method, pathToUse);
        return pathToUse;
    }

    /**
     * return the value of an environment variable provided or the original value.
     * @param {string} property the property value to see if it is a reference to an env var or not.
     * @return {string} the value
     */
    static getValueOrEnv(property) {
        let value = ('' + property).trim();
        if (value.startsWith('{') && value.endsWith('}')) {
            return process.env[value.substring(1, value.length - 1)];
        }
        return property;
    }

    /**
     * get an appropriate HSM cryptosuite
     * @param {object} ccp The Composer Connection Profile
     * @param {path} keyValStorePath an appropriate path to use for the store
     * @return {CryptoSuite} the HSM crypto suite to use
     *
     */
    static getHSMCryptoSuite(ccp, keyValStorePath) {
        const method = 'getHSMCryptoSuite';
        LOG.entry(method, ccp.client, keyValStorePath);

        const hsmConfig = ccp.client['x-hsm'];

        let library = HLFConnectionManager.getValueOrEnv(hsmConfig.library);
        if (!library) {
            throw new Error('no value provided for HSM library property');
        }

        let slot = HLFConnectionManager.getValueOrEnv(hsmConfig.slot);
        if (slot === null || slot === undefined) {
            throw new Error('no value provided for HSM slot property');
        }

        let pin = HLFConnectionManager.getValueOrEnv(hsmConfig.pin);
        if (!pin) {
            throw new Error('no value provided for HSM pin property');
        }
        LOG.info(method, `HSM enabled to use library ${library} and slot ${slot}`);

        //check the cache for an HSM cryptosuite
        let key = '' + slot + '-' + pin;
        let cryptoSuite = HSMSuite.get(key);
        if (!cryptoSuite) {
            LOG.debug(method, 'creating a new cryptosuite');
            cryptoSuite = Client.newCryptoSuite({ software: false, lib: library, slot: slot * 1, pin: pin + '' });
            // we need to set a path in the CryptoKeyStore even though it is using HSM otherwise
            // it will make the private key ephemeral and not store it in the HSM
            cryptoSuite.setCryptoKeyStore(Client.newCryptoKeyStore({path: keyValStorePath}));
            HSMSuite.set(key, cryptoSuite);
        } else {
            LOG.debug(method, 'reusing an new cryptosuite');
        }

        LOG.exit(method, cryptoSuite);
        return cryptoSuite;
    }

    /**
     * Create a new client.
     * @param {object} ccp The Common Connection Profile
     * @param {boolean} [setupStore] true if a store is required to be setup
     * @return {Promise} A promise which resolves to a client or rejects if an error occurs
     */
    static async createClient(ccp, setupStore) {
        const method = 'createClient';
        LOG.entry(method, setupStore);

        let client;
        let wallet;
        let useHSM = HLFConnectionManager.useHSM(ccp);

        try {

            // check to see if we need to setup a store which requires some checks
            // and setup info before the client can be created.
            if (setupStore) {
                wallet = ccp.wallet || Wallet.getWallet();

                if (!wallet && !ccp.cardName) {
                    throw new Error('No wallet or card name has been specified');
                }

                if (!wallet && !useHSM) {

                    // if not using wallets and not using hsm then we are bog standard
                    // credential store stuff and can use the ccp initCredentialStore
                    // stuff so prep it for the loadFromConfig call.
                    let storePath = HLFConnectionManager.getStoreLocation(ccp);
                    ccp.client.credentialStore = {
                        'path': storePath,
                        'cryptoStore': {
                            'path': storePath
                        }
                    };
                }
            }

            let clientccp = cloneDeep(ccp);
            if (clientccp.wallet){
                delete clientccp.wallet;
            }
            client = Client.loadFromConfig(clientccp);
            if (setupStore) {
                // setup the state store and cryptosuite
                if (useHSM) {
                    await HLFConnectionManager.setupHSM(client, ccp, wallet);
                } else if (wallet) {
                    await HLFConnectionManager.setupWallet(client, wallet);
                } else {

                    // setup a state store and place to store cryptosuite stuff using node-sdk
                    await client.initCredentialStores();
                    delete ccp.client.credentialStore;
                }
            } else {
                // setup the cryptosuite only. This is really only used by requestIdentity.
                if (useHSM) {
                    let hsmCryptoSuite = HLFConnectionManager.getHSMCryptoSuite(ccp, HLFConnectionManager.getStoreLocation(ccp));
                    client.setCryptoSuite(hsmCryptoSuite);
                } else {
                    client.setCryptoSuite(Client.newCryptoSuite());
                }
            }
        } catch(err) {
            let newError = new Error('Failed to create client from connection profile. ' + err);
            throw newError;
        }

        LOG.exit(method);
        return client;
    }

        /**
     * Link a wallet to the fabric-client store and cryptostore
     * @param {Client} client the fabric client
     * @param {Wallet} wallet the wallet implementation
     */
    static async setupWallet(client, wallet) {
        const method = 'setupWallet';
        LOG.entry(method, wallet);
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
     * set up a cryptosuite and state store using HSM.
     * note there is no support for wallets for the state store
     * @param {Client} client the fabric client
     * @param {object} ccp the profile with HSM specific details.
     * @param {Wallet} wallet the wallet to use if defined.
     */
    static async setupHSM(client, ccp, wallet) {
        const method = 'setupHSM';
        LOG.entry(method, wallet);
        let keyValStorePath = HLFConnectionManager.getStoreLocation(ccp);
        let store;
        try {
            if (wallet) {
                store = await new HLFWalletProxy(wallet);
            } else {
                store = await Client.newDefaultKeyValueStore({path: keyValStorePath});
            }
            client.setStateStore(store);

            let hsmCryptoSuite = HLFConnectionManager.getHSMCryptoSuite(ccp, keyValStorePath);
            client.setCryptoSuite(hsmCryptoSuite);
            LOG.exit(method);
        } catch(error) {
            LOG.error(method, error);
            const newError = new Error('error trying to setup a state store and HSM. ' + error);
            throw newError;
        }
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
            if (!HLFConnectionManager.useHSM(connectionOptions)) {
                enrollment.key = enrollment.key.toBytes();
            } else {
                delete enrollment.key;
            }
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
            throw new Error('id not specified or not a string');
        } else if (!publicCert || typeof publicCert !== 'string') {
            throw new Error('publicCert not specified or not a string');
        }

        let client = await HLFConnectionManager.createClient(connectionOptions, true);
        const mspID = client.getMspid();

        let cryptoContent = {
            signedCertPEM: publicCert
        };

        try {
            if (HLFConnectionManager.useHSM(connectionOptions)) {
                let publicKey = KEYUTIL.getKey(publicCert);
                let ecdsakey = new ecdsaKey(publicKey);
                cryptoContent.privateKeyObj = await client.getCryptoSuite().getKey(Buffer.from(ecdsakey.getSKI(), 'hex'));

            } else {
                if (!privateKey || typeof privateKey !== 'string') {
                    throw new Error('privateKey not specified or not a string');
                }
                cryptoContent.privateKeyPEM = privateKey;
            }

            await client.createUser(
                {
                    username: id,
                    mspid: mspID,
                    cryptoContent: cryptoContent
                });
            LOG.exit(method);
        } catch (error) {
            let newError = new Error(`Failed to import identity. ${error}`);
            newError.cause = error;
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

        // this should return the first defined channel.
        const channel = client.getChannel();
        // Create a CA client.
        const caClient = client.getCertificateAuthority();

        // Now we can create the connection.
        let connection = HLFConnectionManager.createHLFConnection(this, connectionProfile, businessNetworkIdentifier, connectOptions, client, channel, caClient);
        // Don't log the connection object it's too big
        LOG.exit(method);
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
                certificate: user.getIdentity()._certificate
            };
            if (!HLFConnectionManager.useHSM(connectionOptions)) {
                result.privateKey = user.getSigningIdentity()._signer._key.toBytes();
            }
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
            let storePath = HLFConnectionManager.getStoreLocation(connectionOptions);
            let exists = await HLFConnectionManager._exists(storePath);
            if (exists) {
                const thenifyFSExtra = thenifyAll(fsextra);
                await thenifyFSExtra.remove(storePath);
            }
            return exists;

        } else {
            throw new Error('Unable to remove identity as no card name provided');
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
