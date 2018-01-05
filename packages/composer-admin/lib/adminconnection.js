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
const fs = require('fs');
const FileSystemCardStore = require('composer-common').FileSystemCardStore;
const Logger = require('composer-common').Logger;
const Util = require('composer-common').Util;
const uuid = require('uuid');
const IdCard = require('composer-common').IdCard;
const LOG = Logger.getLog('AdminConnection');

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

        this.cardStore = options.cardStore || new FileSystemCardStore({fs : options.fs || fs});
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
    importCard(name, card) {
        let connectionProfileData = card.getConnectionProfile();
        let connectionManager;
        connectionProfileData.cardName = name;
        let updated = false;
        return this.connectionProfileManager.getConnectionManagerByType(connectionProfileData.type)
            .then((connectionManager_) => {
                connectionManager = connectionManager_;
                return this.cardStore.has(name);
            })
            .then((exists) => {
                updated = exists;
                if (exists) {
                    return connectionManager.removeIdentity(connectionProfileData.name, connectionProfileData, card.getUserName());
                }
            })
            .then(() => {
                return this.cardStore.put(name, card);
            })
            .then(() => {
                // if we have a certificate and privateKey we should ask the connection manager to import
                let certificate = card.getCredentials().certificate;
                let privateKey = card.getCredentials().privateKey;
                if (certificate && privateKey){
                    return connectionManager.importIdentity(connectionProfileData.name, connectionProfileData, card.getUserName(), certificate, privateKey);
                }
            })
            .then(() => {
                return updated;
            });
    }

    /**
     * Exports an network card.
     * Should the card not actually contain the certificates in the card, a exportIdentity will be
     * performed to get the details of the cards
     * @param {String} cardName The name of the card that needs to be exported
     * @return {Promise} resolved with an instance of the network id card populated
     */
    exportCard (cardName) {
        let card;
        return this.cardStore.get(cardName)
            .then((result) => {
                card = result;
                let credentials = card.getCredentials();
                //anything set? if so don't go and get the credentials again
                if (credentials.certificate || credentials.privateKey) {
                    return card;
                } else {
                    // check to make sure the credentials are present and if not then extract them.
                    let connectionProfileData = card.getConnectionProfile();
                    connectionProfileData.cardName = cardName;
                    return this.connectionProfileManager.getConnectionManagerByType(connectionProfileData.type)
                        .then((connectionManager) => {
                            return connectionManager.exportIdentity(connectionProfileData.name, connectionProfileData, card.getUserName());
                        })
                        .then((result) => {
                            if (result) {
                                //{ certificate: String, privateKey: String }
                                card.setCredentials(result);
                            }
                            return card;
                        });
                }
            });
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
    _deleteCard(name) {
        let connectionManager;
        let connectionProfileData;
        let cardUserName;
        let deleted;

        return this.cardStore.get(name)
        .then((card) => {
            connectionProfileData = card.getConnectionProfile();
            cardUserName = card.getUserName();
            connectionProfileData.cardName = name;
            return this.connectionProfileManager.getConnectionManagerByType(connectionProfileData.type);
        })
        .then((connectionManager_) => {
            connectionManager = connectionManager_;
            return this.cardStore.delete(name);
        })
        .then((deleted_) => {
            deleted = deleted_;
            return connectionManager.removeIdentity(connectionProfileData.name, connectionProfileData, cardUserName);
        })
        .then(() => {
            return deleted;
        });

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
     * THIS METHOD SHOULD NOT BE USED
     * Connects and logs in to the Hyperledger Fabric using a named connection
     * profile.
     * @example
     * asd
     * The connection profile must exist in the profile store.
     * @param {String} connectionProfile - The name of the connection profile
     * @param {String} enrollmentID the enrollment ID of the user
     * @param {String} enrollmentSecret the enrollment secret of the user
     * @param {String} businessNetworkIdentifier the id of the network (for update) or null
     * @return {Promise} A promise that indicates the connection is complete
     * @deprecated
     * @private
     */
    connectWithDetails (connectionProfile, enrollmentID, enrollmentSecret, businessNetworkIdentifier) {
        return this.connectionProfileManager.connect(connectionProfile, businessNetworkIdentifier)
            .then((connection) => {
                this.connection = connection;
                return connection.login(enrollmentID, enrollmentSecret);
            })
            .then((securityContext) => {
                this.securityContext = securityContext;
                if (businessNetworkIdentifier) {
                    return this.ping(this.securityContext);
                }
            });
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
     * @return {Promise} A promise that when resolved indicates the connection is complete
     */
    connect (cardName) {
        const method = 'connectWithCard';
        LOG.entry(method, cardName);

        let card;

        return this.cardStore.get(cardName)
            .then((card_) => {
                card = card_;
                return this.connectionProfileManager.connectWithData(
                    card.getConnectionProfile(),
                    card.getBusinessNetworkName(),
                    {cardName : cardName});
            })
            .then((connection) => {
                this.connection = connection;
                let secret = card.getEnrollmentCredentials();
                if (!secret) {
                    secret = 'na';
                } else {
                    secret = secret.secret;
                }
                return connection.login(card.getUserName(), secret);
            })
            .then((securityContext) => {
                this.securityContext = securityContext;
                this.securityContext.card = card;
                if (card.getBusinessNetworkName()) {
                    return this.ping(this.securityContext);
                }
            }).then(() => {
                return;
            });
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
     * Installs the Hyperledger Composer runtime to the Hyperledger Fabric in preparation
     * for the business network to be started. The connection must be connected for this method to succeed.
     * You must pass the name of the business network that is defined in your archive that this
     * runtime will be started with.
     * @example
     * // Install the Hyperledger Composer runtime
     * let adminConnection = new AdminConnection();
     * let businessNetworkDefinition = BusinessNetworkDefinition.fromArchive(myArchive);
     * try {
     *    await adminConnection.connect('adminCard@hlfv1')
     *    await adminConnection.install(businessNetworkDefinition.getName());
     *     // Business network definition installed
     * } catch(error){
     *     // Add optional error handling here.
     * }
     * @param {String} businessNetworkName - The name of business network which will be used to start this runtime.
     * @param {Object} installOptions connector specific install options
     * @return {Promise} A promise that will be fufilled when the business network has been
     * deployed.
     *
     */
    install (businessNetworkName, installOptions) {
        return Promise.resolve().then(() => {
            Util.securityCheck(this.securityContext);
            return this.connection.install(this.securityContext, businessNetworkName, installOptions);
        });
    }

    /**
     * Generate an array of bootstrap transactions for the business network.
     * @private
     * @param {Factory} factory The factory to use.
     * @param {String} identityName The name of the current identity.
     * @param {String} identityCertificate The certificate for the current identity.
     * @return {Resource[]} An array of bootstrap transactions for the business network.
     */
    _generateBootstrapTransactions (factory, identityName, identityCertificate) {
        const method = '_generateBootstrapTransactions';
        LOG.entry(method);
        const participant = factory.newResource('org.hyperledger.composer.system', 'NetworkAdmin', identityName);
        const targetRegistry = factory.newRelationship('org.hyperledger.composer.system', 'ParticipantRegistry', participant.getFullyQualifiedType());
        const addParticipantTransaction = factory.newTransaction('org.hyperledger.composer.system', 'AddParticipant');
        Object.assign(addParticipantTransaction, {
            resources : [participant],
            targetRegistry
        });
        LOG.debug(method, 'Created bootstrap transaction to add participant', addParticipantTransaction);
        const bindIdentityTransaction = factory.newTransaction('org.hyperledger.composer.system', 'BindIdentity');
        Object.assign(bindIdentityTransaction, {
            participant : factory.newRelationship('org.hyperledger.composer.system', 'NetworkAdmin', identityName),
            certificate : identityCertificate
        });
        LOG.debug(method, 'Created bootstrap transaction to bind identity', bindIdentityTransaction);
        const result = [
            addParticipantTransaction,
            bindIdentityTransaction
        ];
        LOG.exit(method, result);
        return result;
    }

    /**
     * Build the JSON for the start transaction.
     * @private
     * @param {BusinessNetworkDefinition} businessNetworkDefinition The business network definition.
     * @param {Object} [startOptions] The options for starting the business network.
     * @param {Object} [startOptions.card] The card to be used as the NetworkAdmin
     * @return {Promise} A promise that will be fufilled with the JSON for the start transaction.
     */
    _buildStartTransaction (businessNetworkDefinition, startOptions) {
        const method = '_buildStartTransaction';
        LOG.entry(method, businessNetworkDefinition, startOptions);

        // Get the current identity - we may need it to bind the
        // identity to a network admin participant.
        return Promise.resolve()
            .then(() => {
                return businessNetworkDefinition.toArchive({ date: new Date(545184000000) });
            })
            .then((businessNetworkArchive) => {

                // Create a new instance of a start transaction.
                const factory = businessNetworkDefinition.getFactory();
                const serializer = businessNetworkDefinition.getSerializer();
                const startTransaction = factory.newTransaction('org.hyperledger.composer.system', 'StartBusinessNetwork');
                const classDeclaration = startTransaction.getClassDeclaration();
                startTransaction.businessNetworkArchive = businessNetworkArchive.toString('base64');

                let hasNetworkAdmins = startOptions && startOptions.networkAdmins && startOptions.networkAdmins.length > 0;
                let hasBootStrapTransactions = startOptions && startOptions.bootstrapTransactions && startOptions.bootstrapTransactions.length > 0;

                if (!hasNetworkAdmins && !hasBootStrapTransactions) {
                    throw new Error('No network administrators or bootstrap transactions are specified');
                }

                if (hasNetworkAdmins && hasBootStrapTransactions) {
                    throw new Error('You cannot specify both network administrators and bootstrap transactions');
                }

                startOptions.networkAdmins = startOptions.networkAdmins || [];

                let bootstrapTransactions = this._buildNetworkAdminTransactions(businessNetworkDefinition, startOptions.networkAdmins);

                // Merge the start options and bootstrap transactions.
                if (startOptions.bootstrapTransactions) {
                    startOptions.bootstrapTransactions = bootstrapTransactions.concat(startOptions.bootstrapTransactions);
                } else {
                    startOptions.bootstrapTransactions = bootstrapTransactions;
                }

                // Otherwise, parse all of the supplied bootstrap transactions.
                // if (startOptions.bootstrapTransactions) {
                startTransaction.bootstrapTransactions = startOptions.bootstrapTransactions.map((bootstrapTransactionJSON) => {
                    return serializer.fromJSON(bootstrapTransactionJSON);
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
                const startTransactionJSON = serializer.toJSON(startTransaction);
                LOG.exit(method, startTransactionJSON);
                return startTransactionJSON;

            });
    }

    /**
     * Build the transactions to create a set of network administrators
     *
     * @param {BusinessNetworkDefinition} businessNetworkDefinition usual network definition
     * @param {Object[]} networkAdmins array of objects that are defining the network admins
     *                                 [ { name, certificate } , { name, enrollmentSecret  }]
     * @return {Object[]} The bootstrap transactions.
     * @private
     */
    _buildNetworkAdminTransactions (businessNetworkDefinition, networkAdmins) {
        const method = '_buildNetworkAdminTransactions';
        LOG.entry(method, businessNetworkDefinition, networkAdmins);

        const factory = businessNetworkDefinition.getFactory();
        const serializer = businessNetworkDefinition.getSerializer();

      //  if (!networkAdmins){return [];}
        // Convert the network administrators into add participant transactions.
        const addParticipantTransactions = networkAdmins.map((networkAdmin) => {
            if (!networkAdmin.userName) {
                throw new Error('A user name must be specified for all network administrators');
            }

            const participant = factory.newResource('org.hyperledger.composer.system', 'NetworkAdmin', networkAdmin.userName);
            const targetRegistry = factory.newRelationship('org.hyperledger.composer.system', 'ParticipantRegistry', participant.getFullyQualifiedType());
            const addParticipantTransaction = factory.newTransaction('org.hyperledger.composer.system', 'AddParticipant');
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
                identityTransaction = factory.newTransaction('org.hyperledger.composer.system', 'BindIdentity');
                Object.assign(identityTransaction, {
                    participant : factory.newRelationship('org.hyperledger.composer.system', 'NetworkAdmin', networkAdmin.userName),
                    certificate : networkAdmin.certificate
                });
                LOG.debug(method, 'Created bootstrap transaction to bind identity', identityTransaction);
            } else if (networkAdmin.enrollmentSecret) {
                // Handle an enrollment secret which requires an issue identity transaction.
                identityTransaction = factory.newTransaction('org.hyperledger.composer.system', 'IssueIdentity');
                Object.assign(identityTransaction, {
                    participant : factory.newRelationship('org.hyperledger.composer.system', 'NetworkAdmin', networkAdmin.userName),
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
            return serializer.toJSON(transaction);
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
     * let businessNetworkDefinition = BusinessNetworkDefinition.fromArchive(myArchive);
     * try {
     *     await adminConnection.connect('userCard@network')
     *     await adminConnection.start(businessNetworkDefinition,
     *              { networkAdmins:
     *                  [ {userName : 'admin', enrollmentSecret:'adminpw'} ]
     *              }
     *
     *     // Business network definition is started
     * } catch(error){
     *     // Add optional error handling here.
     * }
     * @param {BusinessNetworkDefinition} businessNetworkDefinition - The business network to start
     * @param {Object} [startOptions] connector specific start options
     *                  networkAdmins:   [ { userName, certificate } , { userName, enrollmentSecret  }]
     *
     * @return {Promise} A promise that will be fufilled when the business network has been
     * deployed - with a MAP of cards key is name
     */
    start(businessNetworkDefinition, startOptions) {
        const method = 'start';
        LOG.entry(method, businessNetworkDefinition, startOptions);
        Util.securityCheck(this.securityContext);
        let networkAdmins = startOptions.networkAdmins;
        // Build the start transaction.
        return this._buildStartTransaction(businessNetworkDefinition, startOptions)
            .then((startTransactionJSON) => {
                // Now we can start the business network.
                return this.connection.start(this.securityContext, businessNetworkDefinition.getName(), JSON.stringify(startTransactionJSON), startOptions);
            })
            .then(() => {

                let connectionProfile = this.securityContext.card.getConnectionProfile();

                // loop over the network admins, and put cards for each into
                // a map, indexed by the userName
                let createdCards = new Map();
                if (networkAdmins){
                    networkAdmins.forEach( (networkAdmin) =>{

                        let metadata= {
                            version : 1,
                            userName : networkAdmin.userName,
                            businessNetwork : businessNetworkDefinition.getName()
                        };

                        let newCard;
                        if (networkAdmin.enrollmentSecret ){
                            metadata.enrollmentSecret = networkAdmin.enrollmentSecret ;
                            newCard = new IdCard(metadata,connectionProfile);
                        } else {
                            newCard = new IdCard(metadata,connectionProfile);
                            newCard.setCredentials({ certificate : networkAdmin.certificate });
                        }
                        createdCards.set(networkAdmin.userName,newCard);

                    });
                }
                LOG.exit(method);
                return createdCards;
            });
    }

    /**
     * Deploys a new BusinessNetworkDefinition to the Hyperledger Fabric. The connection must
     * be connected for this method to succeed.
     * @example
     * // Deploy a Business Network Definition
     * let adminConnection = new AdminConnection();
     * let businessNetworkDefinition = BusinessNetworkDefinition.fromArchive(myArchive);
     * try {
     *    await adminConnection.connect('userCard@network')
     *    await adminConnection.deploy(businessNetworkDefinition)
     *    // Business network definition deployed
     * } catch(error) {
     *     // Add error handling here.
     * }
     * @param {BusinessNetworkDefinition} businessNetworkDefinition - The business network to deploy
     * @param {Object} deployOptions connector specific deployment options
     *                deployOptions.card the card to use for the NetworkAdmin
     * @return {Promise} A promise that will be fufilled when the business network has been
     * deployed.
     * @deprecated Please install() and start()
     */
    deploy (businessNetworkDefinition, deployOptions) {
        const method = 'deploy';
        LOG.entry(method, businessNetworkDefinition, deployOptions);
        Util.securityCheck(this.securityContext);

        // Build the start transaction.

        return this._buildStartTransaction(businessNetworkDefinition, deployOptions)
            .then((startTransactionJSON) => {
                // Now we can deploy the business network.
                return this.connection.deploy(this.securityContext, businessNetworkDefinition.getName(), JSON.stringify(startTransactionJSON), deployOptions);
            })
            .then(() => {
                LOG.exit(method);
            });
    }

    /**
     * Undeploys a BusinessNetworkDefinition from the Hyperledger Fabric. The business network will no
     * longer be able to process transactions.
     * @example
     * // Undeploy a Business Network Definition
     * let adminConnection = new AdminConnection();
     * try {
     *    await adminConnection.connect('userCard@network')
     *    await adminConnection.undeploy('network-name')
     *    // Undeployed Business Network Definition
     * } catch(error){
     *     // Add error handling here.
     * }
     * @param {String} businessNetworkName - The name of business network that will be used to start this runtime.
     * @return {Promise} A promise that will be fufilled when the business network has been
     * undeployed.
     */
    undeploy (businessNetworkName) {
        return Promise.resolve().then(() => {
            Util.securityCheck(this.securityContext);
            return this.connection.undeploy(this.securityContext, businessNetworkName);
        });
    }

    /**
     * Updates an existing BusinessNetworkDefinition on the Hyperledger Fabric. The BusinessNetworkDefinition
     * must have been previously deployed.
     * @example
     * // Updates a Business Network Definition
     * let adminConnection = new AdminConnection();
     * let businessNetworkDefinition = BusinessNetworkDefinition.fromArchive(myArchive);
     * try {
     *    await adminConnection.connect('userCard@network')
     *    await adminConnection.update(businessNetworkDefinition)
     *    // Business network definition updated
     * } catch(error){
     *     // Add optional error handling here.
     * }
     * @param {BusinessNetworkDefinition} businessNetworkDefinition - The new BusinessNetworkDefinition
     * @return {Promise} A promise that will be fufilled when the business network has been
     * updated.
     */
    update (businessNetworkDefinition) {
        return Promise.resolve().then(() => {
            Util.securityCheck(this.securityContext);
            return this.connection.update(this.securityContext, businessNetworkDefinition);
        });
    }

    /**
     * Resets an existing BusinessNetworkDefinition on the Hyperledger Fabric. The BusinessNetworkDefinition
     * must have been previously deployed.
     *
     * Note this will remove ALL the contents of the network registries, but not any system registries
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
     * Upgrades an existing business network's composer runtime to a later level.
     * The connection must be connected specifying the business network identifier as part of the
     * connection for this method to succeed.
     * @return {Promise} A promise that will be fufilled when the composer runtime has been upgraded,
     * or rejected otherwise.
     * @example
     * // Upgrade the Hyperledger Composer runtime
     * let adminConnection = new AdminConnection();
     * try {
     *    await adminConnection.connect('userCard@networkName')
     *    await adminConnection.upgrade();
     *
     *    // Business network definition upgraded
     * } catch(error) => {
     *    // Add error handling here.
     * }
     * @memberof AdminConnection
     */
    upgrade () {
        return Promise.resolve().then(() => {
            Util.securityCheck(this.securityContext);
            return this.connection.upgrade(this.securityContext);
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
            transactionId : uuid.v4(),
            timestamp : new Date().toISOString()
        };
        return Util.invokeChainCode(this.securityContext, 'submitTransaction', [JSON.stringify(json)])
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
                return this.connectionProfileManager.getConnectionManagerByType(connectionProfileData.type);
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
}

module.exports = AdminConnection;
