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
        const mspID = client.getMspid();
        //TODO check if mspId, organisation is defined
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

        // TODO: check mspId and organisation have been defined
        // TODO: find a channel, should be provided by node sdk
        let channelNames = Object.keys(client._network_config._network_config.channels);
        const channel = client.getChannel(channelNames[0]);


        return this._setupWallet(client, wallet)
            .then(() => {

                // Create a CA client.
                const caClient = client.getCertificateAuthority();

                // Now we can create the connection.
                let connection = HLFConnectionManager.createHLFConnection(this, connectionProfile, businessNetworkIdentifier, connectOptions, client, channel, caClient);
                LOG.exit(method, connection);
                return connection;
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
