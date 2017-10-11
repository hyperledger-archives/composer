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
     * Create a new CA client. TO BE REMOVED AS IT SHOULD COME FROM NODE_SDK
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
     * TODO: should already be available in sdk, just isn't in NPM yet.
     *
     *
     * @static
     * @param {any} client client
     * @param {any} cryptosuite suite
     * @returns {object} caClient
     * @memberof HLFConnectionManager
     */
    static parseCA_CCP(client, cryptosuite) {
        let networkConfig = client._network_config;
        let clientConfig = networkConfig.getClientConfig();
        if (clientConfig && clientConfig.organization) {
            let orgConfig = networkConfig.getOrganization(clientConfig.organization);
            if (orgConfig) {
                let cas = orgConfig.getCertificateAuthorities();
                if (cas.length > 0) {
                    let ca = cas[0];
                    let tlsOpts = null;
                    if (ca.getTlsCACerts()) {
                        tlsOpts = {
                            trustedRoots: [ca.getTlsCACerts()], //TODO handle non existent
                            verify: ca.getConnectionOptions().verify //TODO handle non existent
                        };
                    }
                    return HLFConnectionManager.createCAClient(ca.getUrl(), tlsOpts, (ca.getName() || null), cryptosuite);
                }
            }
        }

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
     * @param {string} keyValStorePath a path for the fileKeyValStore to use or null/undefined if a wallet specified.
     * @returns {Promise} resolves to a client configured with the required stores
     *
     * @memberOf HLFConnectionManager
     */
    _setupWallet(client, wallet) {
        const method = '_setupWallet';
        // If a wallet has been specified, then we want to use that.
        LOG.entry(method, client, wallet);

        //TODO: Need to support the CCP wallet option http://github.com/hyperledger/composer/issues/935
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
            return client.initCredentialStores()
                .catch((error) => {
                    LOG.error(method, error);
                    let newError = new Error('error trying to setup a keystore path. ' + error);
                    throw newError;
                });

            /*
            //TODO: Surely the Node SDK Should be doing this ?
            let clientConfig = client._network_config.getClientConfig();
            // No wallet specified, so create a file based key value store.
            //LOG.debug(method, 'Using key value store', keyValStorePath);
            return Client.newDefaultKeyValueStore({path: clientConfig.credentialStore.path})
                .then((store) => {
                    client.setStateStore(store);

                    let cryptoSuite = Client.newCryptoSuite();
                    cryptoSuite.setCryptoKeyStore(Client.newCryptoKeyStore({path: clientConfig.credentialStore.cryptoStore.path}));
                    client.setCryptoSuite(cryptoSuite);

                    return store;
                })
                .catch((error) => {
                    LOG.error(method, error);
                    let newError = new Error('error trying to setup a keystore path. ' + error);
                    throw newError;
                });
                */
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
        }

        // Submit the enrollment request to Fabric CA.
        LOG.debug(method, 'Submitting enrollment request');
        let options = { enrollmentID: enrollmentID, enrollmentSecret: enrollmentSecret };
        const client = HLFConnectionManager.createClient(connectionOptions);
        const caClient = HLFConnectionManager.parseCA_CCP(client, client.getCryptoSuite());

        // TODO need a better way to determine the name of the caClient that has been instantiated.
        let caName = caClient._fabricCAClient._caName;
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

        let client = HLFConnectionManager.createClient(connectionOptions);
        const mspID = HLFConnection.getMspId(client);
        return this._setupWallet(client, wallet)
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

        // Create a new client instance.
        const client = HLFConnectionManager.createClient(connectOptions);

        // find a channel
        let channelNames = Object.keys(client._network_config._network_config.channels);
        const channel = client.getChannel(channelNames[0]);


        return this._setupWallet(client, wallet)
            .then(() => {

                // Create a CA client.
                const caClient = HLFConnectionManager.parseCA_CCP(client, client.getCryptoSuite());

                // Now we can create the connection.
                let connection = new HLFConnection(this, connectionProfile, businessNetworkIdentifier, connectOptions, client, channel, /*eventHubs,*/ caClient);
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
     * @return {Promise} Resolves to credentials in the form <em>{ certificate: String, privateKey: String }</em>.
     */
    exportIdentity(connectionProfileName, connectionOptions, id) {
        const method = 'exportIdentity';
        LOG.entry(method, connectionProfileName, connectionOptions, id);
        const client = HLFConnectionManager.createClient(connectionOptions);
        return this._setupWallet(client, connectionOptions.wallet)
            .then(() => {
                return client.getUserContext(id, true);
            })
            .then((user) => {
                const result = {
                    certificate: user.getIdentity()._certificate,
                    privateKey: user.getSigningIdentity()._signer._key.toBytes()
                };
                LOG.exit(method, result);
                return result;
            });
    }
}

module.exports = HLFConnectionManager;
