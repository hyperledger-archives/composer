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

const ConnectionProfileManager = require('composer-common').ConnectionProfileManager;
const NetworkCardStoreManager = require('composer-common').NetworkCardStoreManager;
const Factory = require('composer-common').Factory;
const Logger = require('composer-common').Logger;
const ModelManager = require('composer-common').ModelManager;
const Util = require('composer-common').Util;
const IdCard = require('composer-common').IdCard;
const Serializer = require('composer-common').Serializer;

const LOG = Logger.getLog('AdminConnection');

const systemModelManager = new ModelManager();
const systemFactory = new Factory(systemModelManager);
const systemSerializer = new Serializer(systemFactory, systemModelManager);

/**
 * This class creates an administration connection to a Hyperledger Composer runtime. The
 * connection can then be used to:
 *
 *
 * - Deploy BusinessNetworkDefinitions
 * - Undeploy BusinessNetworkDefinitions
 * - Update BusinessNetworkDefinitions
 * - Send a ping message to the runtime to ensure it is running and correctly configured.
 * - Store a connection profile document in the connection profile store
 *
 *
 * Note: that the methods on this class take the 'businessNetworkIdentifier'; this has to match
 * the name given on the create call. An AdminConnection that has been connected to network-A can
 * only be used to adminster network-A.
 *
 * Instances of AdminConnections can be reused for different networks. Call `disconnect(..)` then `connect(..)`.
 * Calling an api after disconnect and before connect will give an error.
 * @class
 * @memberof module:composer-admin
 */
class AdminConnection {

    /**
     * Create an instance of the AdminConnection class.
     *
     * The default cardstore is a filesystem based one that stores files in `~/.composer`
     *
     * @param {Object} [options] - an optional set of options to configure the instance.
     * @param {BusinessNetworkCardStore} [options.cardStore] specify a card store implementation to use.
     */
    constructor (options) {

        const method = 'constructor';
        LOG.entry(method, options);
        options = options || {};

        this.cardStore = options.cardStore || NetworkCardStoreManager.getCardStore(options.wallet);
        this.connectionProfileManager = new ConnectionProfileManager();
        this.connection = null;
        this.securityContext = null;

        LOG.exit(method);
    }

    /**
     * Import a business network card. If a card of this name exists, it is replaced.
     * @param {String} name Name by which this card should be referred
     * @param {IdCard} card The card to import
     * @return {Promise} Resolved when the card is imported, resolves to true if updated, false if added.
     */
    async importCard(name, card) {
        const connectionProfileData = card.getConnectionProfile();
        connectionProfileData.cardName = name;
        const connectionManager = await this.connectionProfileManager.getConnectionManagerByType(connectionProfileData['x-type']);
        connectionProfileData.wallet = await this.cardStore.getWallet(name);
        const exists = await this.cardStore.has(name);
        if (exists) {
            await connectionManager.removeIdentity(connectionProfileData.name, connectionProfileData, card.getUserName());
        }
        // if we have a certificate and optionally a privateKey we should ask the connection manager to import
        const certificate = card.getCredentials().certificate;
        const privateKey = card.getCredentials().privateKey;
        if (certificate){
            await connectionManager.importIdentity(connectionProfileData.name, connectionProfileData, card.getUserName(), certificate, privateKey);
        }
        await this.cardStore.put(name, card);
        return exists;
    }

    /**
     * Exports an network card.
     * Should the card not actually contain the certificates in the card, a exportIdentity will be
     * performed to get the details of the cards
     * @param {String} cardName The name of the card that needs to be exported
     * @return {Promise} resolved with an instance of the network id card populated
     */
    async exportCard (cardName) {
        const card = await this.cardStore.get(cardName);
        const credentials = card.getCredentials();
        //anything set? if so don't go and get the credentials again
        if (credentials.certificate || credentials.privateKey) {
            return card;
        }
        // check to make sure the credentials are present and if not then extract them.
        const connectionProfileData = card.getConnectionProfile();
        connectionProfileData.cardName = cardName;
        const connectionManager = await this.connectionProfileManager.getConnectionManagerByType(connectionProfileData['x-type']);
        connectionProfileData.wallet = await this.cardStore.getWallet(cardName);
        const identity = await connectionManager.exportIdentity(connectionProfileData.name, connectionProfileData, card.getUserName());
        if (identity) {
            //{ certificate: String, privateKey: String }
            card.setCredentials(identity);
        }
        return card;
    }

    /**
     * List all Business Network cards.
     * @return {Promise} resolved with a  Map of idcard objects keyed by their  String names.
     */
    getAllCards () {
        return this.cardStore.getAll();
    }

    /**
     * Delete a card which is known to exist
     * @param {String} name Name of the card to delete.
     * @returns {Promise} Resolves with true if the existing card was deleted; rejected otherwise.
     * @private
     */
    async _deleteCard(name) {
        const card = await this.cardStore.get(name);
        const connectionProfileData = card.getConnectionProfile();
        const cardUserName = card.getUserName();
        connectionProfileData.cardName = name;
        connectionProfileData.wallet = await this.cardStore.getWallet(name);
        const connectionManager = await this.connectionProfileManager.getConnectionManagerByType(connectionProfileData['x-type']);
        const deleted = await this.cardStore.delete(name);
        await connectionManager.removeIdentity(connectionProfileData.name, connectionProfileData, cardUserName);
        return deleted;
    }

    /**
     * Delete an existing card.
     * @param {String} name Name of the card to delete.
     * @returns {Promise} Resolves true if deleted, false if not deleted, is rejected if an error occurs.
     */
    deleteCard(name) {
        return this.cardStore.has(name)
            .then((exists) => {
                if (exists) {
                    return this._deleteCard(name);
                }
                return false;
            });
    }

    /**
     * Has a existing card.
     * @param {String} name Name of the card to check.
     * @returns {Promise} Resolves with true if the card with the name exists, resolved with false if not
     */
    hasCard (name) {
        return this.cardStore.has(name);
    }

    /**
     * Connects and logs in to the Hyperledger Fabric using a named connection
     * profile.
     *
     * The connection profile must exist in the profile store.
     * @example
     * // Connect to Hyperledger Fabric
     * let adminConnection = new AdminConnection();
     * try {
     *   await adminConnection.connect('userCard@network')
     *   // Connected.
     * } catch(error){
     *     // Add optional error handling here.
     * }
     * @param {String} cardName - The name of the business network card
     */
    async connect (cardName) {
        const method = 'connect';
        LOG.entry(method, cardName);
        const card = await this.cardStore.get(cardName);
        const wallet = await this.cardStore.getWallet(cardName);
        this.connection = await this.connectionProfileManager.connectWithData(
            card.getConnectionProfile(),
            card.getBusinessNetworkName(),
            { cardName, wallet }
        );
        let secret = card.getEnrollmentCredentials();
        if (!secret) {
            secret = 'na';
        } else {
            secret = secret.secret;
        }
        this.securityContext = await this.connection.login(card.getUserName(), secret);
        this.securityContext.card = card;
        if (card.getBusinessNetworkName()) {
            await this.ping(this.securityContext);
        }
        LOG.exit(method);
    }

    /**
     * Disconnects this connection.securityContext
     * @example
     * // Disconnect from a Business Network
     * let adminConnection = new AdminConnection();
     * try {
     *   await adminConnection.connect('userCard@network')
     *   // Connected
     *   await adminConnection.disconnect()
     *   // and now disconnected.
     * } catch(error){
     *     // Add optional error handling here.
     * }
     * @return {Promise} A promise that will be resolved when the connection is
     * terminated.
     */
    disconnect () {
        if (!this.connection) {
            return Promise.resolve();
        }
        return this.connection.disconnect()
            .then(() => {
                this.connection = null;
                this.securityContext = null;
            });
    }

    /**
     * Installs a business network as chaincode to Hyperledger Fabric in preparation
     * for the business network to be started.
     *
     * The connection must be connected for this method to succeed.
     *
     * @example
     * // Install the Hyperledger Composer runtime
     * let adminConnection = new AdminConnection();
     * let businessNetworkDefinition = BusinessNetworkDefinition.fromArchive(myArchive);
     * try {
     *    await adminConnection.connect('adminCard@hlfv1')
     *    await adminConnection.install(businessNetworkDefinition);
     *    // Business network installed
     * } catch (error) {
     *     // Add optional error handling here.
     * }
     * @param {String} businessNetworkDefinition - The business network to be installed
     * @param {Object} installOptions connector specific install options
     * @return {Promise} A promise that will be fufilled when the business network has been installed
     */
    install (businessNetworkDefinition, installOptions) {
        return Promise.resolve().then(() => {
            Util.securityCheck(this.securityContext);
            return this.connection.install(this.securityContext, businessNetworkDefinition, installOptions);
        });
    }

    /**
     * Build the JSON for the start transaction.
     * @private
     * @param {Object} [startOptions] The options for starting the business network.
     * @param {Object[]} [startOptions.networkAdmins] Network admin credentials.
     * @param {Object[]} [startOptions.bootstrapTransactions] Bootstrap transactions.
     * @return {Promise} A promise that will be fufilled with the JSON for the start transaction.
     */
    _buildStartTransaction (startOptions) {
        const method = '_buildStartTransaction';
        LOG.entry(method, startOptions);

        // Get the current identity - we may need it to bind the
        // identity to a network admin participant.
        return Promise.resolve()
            .then(()=>{

                // Create a new instance of a start transaction.
                const startTransaction = systemFactory.newTransaction('org.hyperledger.composer.system', 'StartBusinessNetwork',startOptions.transactionId.idStr);
                const classDeclaration = startTransaction.getClassDeclaration();
                delete startOptions.transactionId;

                let hasNetworkAdmins = startOptions && startOptions.networkAdmins && startOptions.networkAdmins.length > 0;
                let hasBootStrapTransactions = startOptions && startOptions.bootstrapTransactions && startOptions.bootstrapTransactions.length > 0;

                if (!hasNetworkAdmins && !hasBootStrapTransactions) {
                    throw new Error('No network administrators or bootstrap transactions are specified');
                }

                if (hasNetworkAdmins && hasBootStrapTransactions) {
                    throw new Error('You cannot specify both network administrators and bootstrap transactions');
                }

                startOptions.networkAdmins = startOptions.networkAdmins || [];

                let bootstrapTransactions = this._buildNetworkAdminTransactions(startOptions.networkAdmins);

                // Merge the start options and bootstrap transactions.
                if (startOptions.bootstrapTransactions) {
                    startOptions.bootstrapTransactions = bootstrapTransactions.concat(startOptions.bootstrapTransactions);
                } else {
                    startOptions.bootstrapTransactions = bootstrapTransactions;
                }

                // Otherwise, parse all of the supplied bootstrap transactions.
                // if (startOptions.bootstrapTransactions) {
                startTransaction.bootstrapTransactions = startOptions.bootstrapTransactions.map((bootstrapTransactionJSON) => {
                    return systemSerializer.fromJSON(bootstrapTransactionJSON, { validate: false });
                });

                //
                delete startOptions.bootstrapTransactions;
                delete startOptions.networkAdmins;

                // Now handle the rest of the properties in the start options.
                Object.keys(startOptions).forEach((key) => {
                    LOG.debug(method, 'Checking start option', key);
                    if (classDeclaration.getProperty(key)) {
                        const value = startOptions[key];
                        LOG.debug(method, 'Start option is a property of the start transaction', key, value);
                        startTransaction[key] = value;
                        delete startOptions[key];
                    }
                });

                // Now we can start the business network.
                const startTransactionJSON = systemSerializer.toJSON(startTransaction, { validate: false });
                LOG.exit(method, startTransactionJSON);
                return startTransactionJSON;

            });
    }

    /**
     * Build the transactions to create a set of network administrators
     * @param {Object[]} networkAdmins array of objects that are defining the network admins
     *                                 [ { name, certificate } , { name, enrollmentSecret  }]
     * @return {Object[]} The bootstrap transactions.
     * @private
     */
    _buildNetworkAdminTransactions (networkAdmins) {
        const method = '_buildNetworkAdminTransactions';
        LOG.entry(method, networkAdmins);

      //  if (!networkAdmins){return [];}
        // Convert the network administrators into add participant transactions.
        const addParticipantTransactions = networkAdmins.map((networkAdmin) => {
            if (!networkAdmin.userName) {
                throw new Error('A user name must be specified for all network administrators');
            }

            const participant = systemFactory.newResource('org.hyperledger.composer.system', 'NetworkAdmin', networkAdmin.userName);
            const targetRegistry = systemFactory.newRelationship('org.hyperledger.composer.system', 'ParticipantRegistry', participant.getFullyQualifiedType());
            const addParticipantTransaction = systemFactory.newTransaction('org.hyperledger.composer.system', 'AddParticipant');
            Object.assign(addParticipantTransaction, {
                resources : [participant],
                targetRegistry
            });
            LOG.debug(method, 'Created bootstrap transaction to add participant', addParticipantTransaction);
            return addParticipantTransaction;
        });

        // Convert the network administrators into issue or bind identity transactions.
        const identityTransactions = networkAdmins.map((networkAdmin) => {

            // Handle a certificate which requires a bind identity transaction.
            let identityTransaction;
            if (networkAdmin.certificate) {
                identityTransaction = systemFactory.newTransaction('org.hyperledger.composer.system', 'BindIdentity');
                Object.assign(identityTransaction, {
                    participant : systemFactory.newRelationship('org.hyperledger.composer.system', 'NetworkAdmin', networkAdmin.userName),
                    certificate : networkAdmin.certificate
                });
                LOG.debug(method, 'Created bootstrap transaction to bind identity', identityTransaction);
            } else if (networkAdmin.enrollmentSecret) {
                // Handle an enrollment secret which requires an issue identity transaction.
                identityTransaction = systemFactory.newTransaction('org.hyperledger.composer.system', 'IssueIdentity');
                Object.assign(identityTransaction, {
                    participant : systemFactory.newRelationship('org.hyperledger.composer.system', 'NetworkAdmin', networkAdmin.userName),
                    identityName : networkAdmin.userName
                });
                LOG.debug(method, 'Created bootstrap transaction to issue identity', identityTransaction);
            } else {
                throw new Error('Either a secret or a certificate must be specified for all network administrators');
            }
            return identityTransaction;

        });

        // Serialize all of the transactions into a single array.
        const transactions = addParticipantTransactions.concat(identityTransactions);
        const json = transactions.map((transaction) => {
            return systemSerializer.toJSON(transaction);
        });
        LOG.debug(method, 'Bootstrap transactions', JSON.stringify(json));
        LOG.exit(method, json);
        return json;

    }

    /**
     * Starts a business network within the runtime previously installed to the Hyperledger Fabric with
     * the same name as the business network to be started. The connection must be connected for this
     * method to succeed.
     *
     * @example
     * // Start a Business Network Definition
     * let adminConnection = new AdminConnection();
     * try {
     *     await adminConnection.connect('userCard@network')
     *     await adminConnection.start(networkName, networkVersion,
     *              { networkAdmins:
     *                  [ {userName : 'admin', enrollmentSecret:'adminpw'} ]
     *              }
     *
     *     // Business network definition is started
     * } catch(error){
     *     // Add optional error handling here.
     * }
     * @param {String} networkName - Name of the business network to start
     * @param {String} networkVersion - Version of the business network to start
     * @param {Object} [startOptions] connector specific start options
     *                  networkAdmins:   [ { userName, certificate, privateKey } , { userName, enrollmentSecret  }]
     *
     * @return {Promise} A promise that will be fufilled when the business network has been
     * deployed - with a MAP of cards key is name
     */
    start(networkName, networkVersion, startOptions) {
        const method = 'start';
        LOG.entry(method, networkName, networkVersion, startOptions);
        Util.securityCheck(this.securityContext);
        let networkAdmins = startOptions.networkAdmins;
        // Build the start transaction.
        return Util.createTransactionId(this.securityContext)
            .then((id) =>{
                startOptions.transactionId = id;
                return this._buildStartTransaction(startOptions);
            })
            .then((startTransactionJSON) => {
                // Now we can start the business network.
                return this.connection.start(this.securityContext, networkName, networkVersion, JSON.stringify(startTransactionJSON), startOptions);
            })
            .then(() => {

                let connectionProfile = this.securityContext.card.getConnectionProfile();

                // loop over the network admins, and put cards for each into
                // a map, indexed by the userName
                let createdCards = new Map();
                if (networkAdmins){
                    networkAdmins.forEach( (networkAdmin) =>{

                        const metadata = {
                            version : 1,
                            userName : networkAdmin.userName,
                            businessNetwork : networkName
                        };

                        const enrollmentSecret = networkAdmin.enrollmentSecret;
                        if (enrollmentSecret) {
                            metadata.enrollmentSecret = enrollmentSecret;
                        }

                        const newCard = new IdCard(metadata, connectionProfile);

                        const certificate = networkAdmin.certificate;
                        if (certificate) {
                            const credentials = { certificate: certificate };
                            const privateKey = networkAdmin.privateKey;
                            if (privateKey) {
                                credentials.privateKey = privateKey;
                            }
                            newCard.setCredentials(credentials);
                        }

                        createdCards.set(networkAdmin.userName,newCard);
                    });
                }
                LOG.exit(method);
                return createdCards;
            });
    }

    /**
     * Resets an existing BusinessNetworkDefinition on the Hyperledger Fabric. The BusinessNetworkDefinition
     * must have been previously deployed.
     *
     * Note this will remove ALL the contents of the network registries, but not any system registries
     *
     * IMPORTANT: Never use this api on a production or shared business network. It should only ever be
     * used as a quick reset against a business network running locally on your machine for which you will
     * not keep. Use this for your local development testing purposes only
     *
     * @example
     * // Resets a Business Network Definition
     * let adminConnection = new AdminConnection();
     * let businessNetworkDefinition = BusinessNetworkDefinition.fromArchive(myArchive);
     * try {
     *    await adminConnection.connect('userCard@network')
     *    await adminConnection.reset('network-name')
     *    // Business network data removed
     * } catch(error){
     *     // Add error handling here.
     * }
     * @param {String} businessNetworkName - The name of business network that will be reset
     * @return {Promise} A promise that will be fufilled when the business network has been
     * updated.
     */
    reset (businessNetworkName) {
        return Promise.resolve().then(() => {
            Util.securityCheck(this.securityContext);
            return this.connection.reset(this.securityContext, businessNetworkName);
        });
    }

    /**
     * Upgrades an existing business network to a later level.
     * @param {string} businessNetworkName The name of the business network
     * @param {string} businessNetworkVersion The version of the business network
     * @param {object} [upgradeOptions] connector specific options
     * @return {Promise} A promise that will be fufilled when the composer runtime has been upgraded,
     * or rejected otherwise.
     * @example
     * // Upgrade the Hyperledger Composer runtime
     * let adminConnection = new AdminConnection();
     * try {
     *    await adminConnection.connect('PeerAdmin@hlfv1')
     *    await adminConnection.upgrade('digitalproperty-network', '2.0.0');
     *
     *    // Business network definition upgraded
     * } catch(error) => {
     *    // Add error handling here.
     * }
     * @memberof AdminConnection
     */
    upgrade(businessNetworkName, businessNetworkVersion, upgradeOptions) {
        return Promise.resolve().then(() => {
            Util.securityCheck(this.securityContext);
            return this.connection.upgrade(this.securityContext, businessNetworkName, businessNetworkVersion, upgradeOptions);
        });
    }

    /**
     * Undeploys a business network.
     * <p>
     * <strong>Note: this this currently not supported with Hyperledger Fabric and will throw an error.</strong>
     * @param {String} businessNetworkName The name of business network to remove.
     * @return {Promise} A promise that will be fufilled when the business network has been
     * undeployed.
     */
    undeploy(businessNetworkName) {
        return Promise.resolve().then(() => {
            Util.securityCheck(this.securityContext);
            return this.connection.undeploy(this.securityContext, businessNetworkName);
        });
    }

    /**
     * Test the connection to the runtime and verify that the version of the
     * runtime is compatible with this level of the node.js module.
     * @example
     * // Test the connection to the runtime
     * let adminConnection = new AdminConnection();
     * try {
     *    await adminConnection.connect('userCard@network');
     *    await adminConnection.ping();
     *     // Connection has been tested
     * } catch(error){
     *     // Add error handling here.
     * }
     * @return {Promise} A promise that will be fufilled when the connection has
     * been tested. The promise will be rejected if the version is incompatible.
     */
    ping () {
        const method = 'ping';
        LOG.entry(method);
        return this.pingInner()
            .catch((error) => {
                if (error.message.match(/ACTIVATION_REQUIRED/)) {
                    LOG.debug(method, 'Activation required, activating ...');
                    return this.activate()
                        .then(() => {
                            return this.pingInner();
                        });
                }
                throw error;
            })
            .then((result) => {
                LOG.exit(method, result);
                return result;
            });
    }

    /**
     * Test the connection to the runtime and verify that the version of the
     * runtime is compatible with this level of the client node.js module.
     * @private
     * @return {Promise} A promise that will be fufilled when the connection has
     * been tested. The promise will be rejected if the version is incompatible.
     */
    pingInner () {
        const method = 'pingInner';
        LOG.entry(method);
        return Promise.resolve().then(() => {
            Util.securityCheck(this.securityContext);
            return this.connection.ping(this.securityContext);
        })
            .then((result) => {
                LOG.exit(method, result);
                return result;
            });
    }

    /**
     * Activate the current identity on the currently connected business network.
     * @private
     * @return {Promise} A promise that will be fufilled when the connection has
     * been tested. The promise will be rejected if the version is incompatible.
     */
    activate () {
        const method = 'activate';
        LOG.entry(method);
        const json = {
            $class : 'org.hyperledger.composer.system.ActivateCurrentIdentity',
            timestamp : new Date().toISOString()
        };
        return Util.submitTransaction(this.securityContext,json)
            .then(() => {
                LOG.exit(method);
            });

    }

    /**
     * Set the logging level of a business network. The connection must
     * be connected for this method to succeed.
     * @example
     * // Set the logging level of a business network.
     * let adminConnection = new AdminConnection();
     * try {
     *    await adminConnection.connect('userCard@network')
     *    await adminConnection.setLogLevel('DEBUG')
     *    console.log('log level set to DEBUG');
     * } catch(error){
     *     // Add error handling here.
     * }
     *
     * @param {any} newLogLevel new logging level
     * @returns {Promise} A promise that resolves if successful.
     * @memberof AdminConnection
     */
    setLogLevel (newLogLevel) {
        return Promise.resolve().then(() => {
            Util.securityCheck(this.securityContext);
            return this.connection.setLogLevel(this.securityContext, newLogLevel);
        });
    }

    /**
     * Get the current logging level of a business network. The connection must
     * be connected for this method to succeed.
     * @example
     * // Get the current logging level of a business network.
     * let adminConnection = new AdminConnection();
     * try {
     *    await adminConnection.connect('userCard@network');
     *    let currentLogLevel = await adminConnection.getLogLevel();
     *     console.log('current log level is ' + currentLogLevel);
     * } catch(error){
     *     // Add error handling here.
     * }
     *
     * @returns {Promise} A promise that resolves with the current logging level if successful.
     * @memberof AdminConnection
     */
    getLogLevel () {
        return Promise.resolve().then(() => {
            Util.securityCheck(this.securityContext);
            return this.connection.queryChainCode(this.securityContext, 'getLogLevel', []);
        })
            .then((response) => {
                return Promise.resolve(JSON.parse(response));
            });
    }

    /**
     * List all of the deployed business networks. The connection must
     * be connected for this method to succeed.
     * @example
     * // List all of the deployed business networks.
     * let adminConnection = new AdminConnection();
     * try {
     *    await adminConnection.connect('userCard@network');
     *    let businessNetworks = await adminConnection.list();
     *    businessNetworks.forEach((businessNetwork) => {
     *       console.log('Deployed business network', businessNetwork);
     *    });
     * } catch(error){
     *     // Add error handling here.
     * }
     * @return {Promise} A promise that will be resolved with an array of
     * business network identifiers, or rejected with an error.
     */
    list () {
        return Promise.resolve().then(() => {
            Util.securityCheck(this.securityContext);
            return this.connection.list(this.securityContext);
        });
    }

    /**
     * Request the certificates for an identity. No connection needs to be established
     * for this method to succeed.
     * @example
     * // Request the cryptographic material for am identity of a hlf v1 environment.
     * var adminConnection = new AdminConnection();
     * return adminConnection.requestIdentity('hlfv1', 'admin', 'adminpw')
     * .then((response) => {
     *     // Identity returned
     *     console.log('public signing certificate:');
     *     console.log(response.certificate);
     *     console.log('private key:');
     *     console.log(response.key);
     *     console.log('ca root certificate:');
     *     console.log(response.rootCertificate);
     * })
     * .catch(function(error){
     *     // Add optional error handling here.
     * });
     *
     * @param {String} cardName Name of the card to use
     * @param {String} [enrollmentID] The ID to enroll
     * @param {String} [enrollmentSecret] The secret for the ID
     * @returns {Promise} A promise which is resolved when the identity is imported
     * @deprecated
     * @private
     */
    requestIdentity (cardName, enrollmentID, enrollmentSecret) {
        let connectionProfileData;
        let card;
        return this.cardStore.get(cardName)
            .then((result) => {
                card = result;
                connectionProfileData = card.getConnectionProfile();
                return this.connectionProfileManager.getConnectionManagerByType(connectionProfileData['x-type']);
            })
            .then((connectionManager) => {

                enrollmentID = enrollmentID || card.getUserName();
                enrollmentSecret = enrollmentSecret || card.getEnrollmentCredentials().secret;

                // the connection profile is unused later but passing to keep code happy
                return connectionManager.requestIdentity(connectionProfileData.name, connectionProfileData, enrollmentID, enrollmentSecret);
            }).then((result) => {
                result.enrollId = enrollmentID;
                return result;
            })
            .catch((error) => {
                throw new Error('failed to request identity. ' + error.message);
            });
    }

    /**
     * Get the native API for this connection. The native API returned is specific
     * to the underlying blockchain platform, and may throw an error if there is no
     * native API available.
     * @return {*} The native API for this connection.
     */
    getNativeAPI() {
        if (!this.connection) {
            throw new Error('not connected; must call connect() first');
        }
        return this.connection.getNativeAPI();
    }

}

module.exports = AdminConnection;
