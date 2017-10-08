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

const ComboConnectionProfileStore = require('composer-common').ComboConnectionProfileStore;
const ConnectionProfileManager = require('composer-common').ConnectionProfileManager;
const EnvConnectionProfileStore = require('composer-common').EnvConnectionProfileStore;
const fs = require('fs');
const FSConnectionProfileStore = require('composer-common').FSConnectionProfileStore;
const Logger = require('composer-common').Logger;
const Util = require('composer-common').Util;
const uuid = require('uuid');

const LOG = Logger.getLog('AdminConnection');

/**
 * This class creates an administration connection to a Hyperledger Composer runtime. The
 * connection can then be used to:
 * <ul>
 * <li>Deploy BusinessNetworkDefinitions</li>
 * <li>Undeploy BusinessNetworkDefinitions</li>
 * <li>Update BusinessNetworkDefinitions</li>
 * <li>Send a ping message to the runtime to ensure it is running and
 * correctly configured.</li>
 * <li>Store a connection profile document in the connection profile store</li>
 * </ul>
 *
 * @class
 * @memberof module:composer-admin
 */
class AdminConnection {

    /**
     * Create an instance of the AdminConnection class.
     * @param {Object} [options] - an optional set of options to configure the instance.
     * @param {ConnectionProfileStore} [options.connectionProfileStore] - specify a connection profile store to use.
     * @param {Object} [options.fs] - specify an fs implementation to use.
     */
    constructor(options) {
        const method = 'constructor';
        LOG.entry(method, options);
        options = options || {};
        let connectionProfileStore;
        if (options.connectionProfileStore) {
            LOG.debug(method, 'Using connection profile store from options');
            connectionProfileStore = options.connectionProfileStore;
        } else {
            LOG.debug(method, 'Creating new file system connection profile store');
            connectionProfileStore = new FSConnectionProfileStore(options.fs || fs);
        }
        if (process.env.COMPOSER_CONFIG) {
            LOG.debug(method, 'Enabling environment connection profile store');
            const envConnectionProfileStore = new EnvConnectionProfileStore();
            connectionProfileStore = new ComboConnectionProfileStore(
                connectionProfileStore,
                envConnectionProfileStore
            );
        }
        this.connectionProfileStore = connectionProfileStore;
        this.connectionProfileManager = new ConnectionProfileManager(this.connectionProfileStore);
        this.connection = null;
        this.securityContext = null;
        LOG.exit(method);
    }

    /**
     * Connects and logs in to the Hyperledger Fabric using a named connection
     * profile. The connection profile must exist in the profile store.
     * @example
     * // Connect to Hyperledger Fabric
     * var adminConnection = new AdminConnection();
     * adminConnection.connect('testprofile', 'WebAppAdmin', 'DJY27pEnl16d')
     * .then(function(){
     *     // Connected.
     * })
     * .catch(function(error){
     *     // Add optional error handling here.
     * });
     * @param {string} connectionProfile - The name of the connection profile
     * @param {string} enrollmentID the enrollment ID of the user
     * @param {string} enrollmentSecret the enrollment secret of the user
     * @param {string} businessNetworkIdentifier the id of the network (for update) or null
     * @return {Promise} A promise that indicates the connection is complete
     */
    connect(connectionProfile, enrollmentID, enrollmentSecret, businessNetworkIdentifier) {
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
     * Stores a connection profile into the profile store being used by this
     * AdminConnection.
     * @example
     * // Create a connection profile
     * var adminConnection = new AdminConnection();
     * var adminOptions = {
     *     type: 'hlf',
     *     keyValStore: '/tmp/keyValStore',
     *     membershipServicesURL: 'grpc://membersrvc:7054',
     *     peerURL: 'grpc://vp0:7051',
     *     eventHubURL: 'grpc://vp0:7053'
     * };
     * return adminConnection.createProfile('testprofile', adminOptions)
     * .then(function(){
     *     // Created profile
     * })
     * .catch(function(error){
     *     // Add optional error handling here.
     * });
     * @param {string} connectionProfile - The name of the connection profile
     * @param {Object} data - The connection profile data
     * @return {Promise} A promise that indicates that the connection profile is deployed
     */
    createProfile(connectionProfile, data) {
        return this.connectionProfileManager.getConnectionProfileStore().save(connectionProfile, data);
    }

    /**
     * Deletes the specified connection profile from the profile store being used by this
     * AdminConnection.
     * @example
     * // Delete a connection profile
     * var adminConnection = new AdminConnection();
     * return adminConnection.deleteProfile('testprofile')
     * .then(function(){
     *     // Deleted profile
     * })
     * .catch(function(error){
     *     // Add optional error handling here.
     * });
     * @param {string} connectionProfile - The name of the connection profile
     * @return {Promise} A promise that indicates that the connection profile is deployed
     */
    deleteProfile(connectionProfile) {
        return this.connectionProfileManager.getConnectionProfileStore().delete(connectionProfile);
    }

    /**
     * Retrieve the specified connection profile from the profile store being
     * used by this AdminConnection.
     * @example
     * // Retrieve the connection profile.
     * const adminConnection = new AdminConnection();
     * return adminConnection.getProfile('testprofile')
     *   .then((profile) => {
     *     // Retrieved profile
     *     console.log(profile);
     *   });
     * @param {string} connectionProfile - The name of the connection profile
     * @return {Promise} A promise that is resolved with the connection profile data.
     */
    getProfile(connectionProfile) {
        return this.connectionProfileManager.getConnectionProfileStore().load(connectionProfile);
    }

    /**
     * Retrieve all connection profiles from the profile store being used by this
     * AdminConnection.
     * @example
     * // Retrieve all the connection profiles.
     * const adminConnection = new AdminConnection();
     * return adminConnection.getAllProfiles()
     *   .then((profiles) => {
     *     // Retrieved profiles
     *     for (let profile in profiles) {
     *       console.log(profile, profiles[profile]);
     *     }
     *   });
     * @return {Promise} A promise that is resolved with the connection profile data.
     */
    getAllProfiles() {
        return this.connectionProfileManager.getConnectionProfileStore().loadAll();
    }

    /**
     * Disconnects this connection.
     * @example
     * // Disconnect from a Business Network
     * var adminConnection = new AdminConnection();
     * return adminConnection.disconnect()
     * .then(function(){
     *     // Disconnected.
     * })
     * .catch(function(error){
     *     // Add optional error handling here.
     * });
     * @return {Promise} A promise that will be resolved when the connection is
     * terminated.
     */
    disconnect() {
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
     * for the business network to be started. The connection mustbe connected for this method to succeed.
     * You must pass the name of the business network that is defined in your archive that this
     * runtime will be started with.
     * @example
     * // Install the Hyperledger Composer runtime
     * var adminConnection = new AdminConnection();
     * var businessNetworkDefinition = BusinessNetworkDefinition.fromArchive(myArchive);
     * return adminConnection.install(businessNetworkDefinition.getName())
     * .then(function(){
     *     // Business network definition installed
     * })
     * .catch(function(error){
     *     // Add optional error handling here.
     * });
     * @param {BusinessNetworkIdentifier} businessNetworkIdentifier - The name of business network which will be used to start this runtime.
     * @param {Object} installOptions connector specific install options
     * @return {Promise} A promise that will be fufilled when the business network has been
     * deployed.
     */
    install(businessNetworkIdentifier, installOptions) {
        Util.securityCheck(this.securityContext);
        return this.connection.install(this.securityContext, businessNetworkIdentifier, installOptions);
    }

    /**
     * Get the current identity.
     * @private
     * @return {Promise} A promise that will be fufilled with the current identity.
     */
    _getCurrentIdentity() {
        const method = '_getCurrentIdentity';
        LOG.entry(method);
        let identityName = this.securityContext.getUser();
        LOG.debug(method, 'Current identity name', identityName);
        return this.exportIdentity(this.connection.connectionProfile, identityName)
            .then((identity) => {
                LOG.exit(method, identity);
                return identity;
            });
    }

    /**
     * Generate an array of bootstrap transactions for the business network.
     * @private
     * @param {Factory} factory The factory to use.
     * @param {string} identityName The name of the current identity.
     * @param {string} identityCertificate The certificate for the current identity.
     * @return {Resource[]} An array of bootstrap transactions for the business network.
     */
    _generateBootstrapTransactions(factory, identityName, identityCertificate) {
        const method = '_generateBootstrapTransactions';
        LOG.entry(method);
        const participant = factory.newResource('org.hyperledger.composer.system', 'NetworkAdmin', identityName);
        const targetRegistry = factory.newRelationship('org.hyperledger.composer.system', 'ParticipantRegistry', participant.getFullyQualifiedType());
        const addParticipantTransaction = factory.newTransaction('org.hyperledger.composer.system', 'AddParticipant');
        Object.assign(addParticipantTransaction, {
            resources: [ participant ],
            targetRegistry
        });
        LOG.debug(method, 'Created bootstrap transaction to add participant', addParticipantTransaction);
        const bindIdentityTransaction = factory.newTransaction('org.hyperledger.composer.system', 'BindIdentity');
        Object.assign(bindIdentityTransaction, {
            participant: factory.newRelationship('org.hyperledger.composer.system', 'NetworkAdmin', identityName),
            certificate: identityCertificate
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
     * @return {Promise} A promise that will be fufilled with the JSON for the start transaction.
     */
    _buildStartTransaction(businessNetworkDefinition, startOptions = {}) {
        const method = '_buildStartTransaction';
        LOG.entry(method, businessNetworkDefinition, startOptions);

        // Get the current identity - we may need it to bind the
        // identity to a network admin participant.
        let identityName, identityCertificate;
        return this._getCurrentIdentity()
            .then((identity) => {

                // Extract the current identity name and certificate.
                identityName = this.securityContext.getUser();
                identityCertificate = identity.certificate;

                    // Now serialize the business network archive.
                return businessNetworkDefinition.toArchive();

            })
            .then((businessNetworkArchive) => {

                // Create a new instance of a start transaction.
                const factory = businessNetworkDefinition.getFactory();
                const serializer = businessNetworkDefinition.getSerializer();
                const startTransaction = factory.newTransaction('org.hyperledger.composer.system', 'StartBusinessNetwork');
                const classDeclaration = startTransaction.getClassDeclaration();
                startTransaction.businessNetworkArchive = businessNetworkArchive.toString('base64');

                // If the user has not supplied any bootstrap transactions, then we need
                // to add some:
                // 1) Create a NetworkAdmin participant for the current identity.
                // 2) Bind the current identity to the new NetworkAdmin participant.
                if (!startOptions.bootstrapTransactions || startOptions.bootstrapTransactions.length === 0) {
                    LOG.debug(method, 'No bootstrap transactions specified');
                    startTransaction.bootstrapTransactions = this._generateBootstrapTransactions(factory, identityName, identityCertificate);
                    delete startOptions.bootstrapTransactions;
                }

                // Otherwise, parse all of the supplied bootstrap transactions.
                if (startOptions.bootstrapTransactions) {
                    startTransaction.bootstrapTransactions = startOptions.bootstrapTransactions.map((bootstrapTransactionJSON) => {
                        return serializer.fromJSON(bootstrapTransactionJSON);
                    });
                    delete startOptions.bootstrapTransactions;
                }

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
     * Starts a business network within the runtime previously installed to the Hyperledger Fabric with
     * the same name as the business network to be started. The connection must be connected for this
     * method to succeed.
     * @example
     * // Start a Business Network Definition
     * var adminConnection = new AdminConnection();
     * var businessNetworkDefinition = BusinessNetworkDefinition.fromArchive(myArchive);
     * return adminConnection.start(businessNetworkDefinition)
     * .then(function(){
     *     // Business network definition is started
     * })
     * .catch(function(error){
     *     // Add optional error handling here.
     * });
     * @param {BusinessNetworkDefinition} businessNetworkDefinition - The business network to start
     * @param {Object} [startOptions] connector specific start options
     * @return {Promise} A promise that will be fufilled when the business network has been
     * deployed.
     */
    start(businessNetworkDefinition, startOptions = {}) {
        const method = 'start';
        LOG.entry(method, businessNetworkDefinition, startOptions);
        Util.securityCheck(this.securityContext);

        // Build the start transaction.
        return this._buildStartTransaction(businessNetworkDefinition, startOptions)
            .then((startTransactionJSON) => {

                // Now we can start the business network.
                return this.connection.start(this.securityContext, businessNetworkDefinition.getName(), JSON.stringify(startTransactionJSON), startOptions);

            })
            .then(() => {
                LOG.exit(method);
            });
    }

    /**
     * Deploys a new BusinessNetworkDefinition to the Hyperledger Fabric. The connection must
     * be connected for this method to succeed.
     * @example
     * // Deploy a Business Network Definition
     * var adminConnection = new AdminConnection();
     * var businessNetworkDefinition = BusinessNetworkDefinition.fromArchive(myArchive);
     * return adminConnection.deploy(businessNetworkDefinition)
     * .then(function(){
     *     // Business network definition deployed
     * })
     * .catch(function(error){
     *     // Add optional error handling here.
     * });
     * @param {BusinessNetworkDefinition} businessNetworkDefinition - The business network to deploy
     * @param {Object} deployOptions connector specific deployment options
     * @return {Promise} A promise that will be fufilled when the business network has been
     * deployed.
     */
    deploy(businessNetworkDefinition, deployOptions = {}) {
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
     * var adminConnection = new AdminConnection();
     * return adminConnection.undeploy('identifier')
     * .then(function(){
     *     // Undeployed Business Network Definition
     * })
     * .catch(function(error){
     *     // Add optional error handling here.
     * })
     * @param {string} businessNetworkIdentifier - The identifier of the network to undeploy
     * @return {Promise} A promise that will be fufilled when the business network has been
     * undeployed.
     */
    undeploy(businessNetworkIdentifier) {
        Util.securityCheck(this.securityContext);
        return this.connection.undeploy(this.securityContext, businessNetworkIdentifier);
    }

    /**
     * Updates an existing BusinessNetworkDefinition on the Hyperledger Fabric. The BusinessNetworkDefinition
     * must have been previously deployed.
     * @example
     * // Updates a Business Network Definition
     * var adminConnection = new AdminConnection();
     * var businessNetworkDefinition = BusinessNetworkDefinition.fromArchive(myArchive);
     * return adminConnection.update(businessNetworkDefinition)
     * .then(function(){
     *     // Business network definition updated
     * })
     * .catch(function(error){
     *     // Add optional error handling here.
     * });
     * @param {BusinessNetworkDefinition} businessNetworkDefinition - The new BusinessNetworkDefinition
     * @return {Promise} A promise that will be fufilled when the business network has been
     * updated.
     */
    update(businessNetworkDefinition) {
        Util.securityCheck(this.securityContext);
        return this.connection.update(this.securityContext, businessNetworkDefinition);
    }

    /**
     * Upgrades an existing business network's composer runtime to a later level.
     * The connection must be connected specifying the business network identifier as part of the
     * connection for this method to succeed.
     * @return {Promise} A promise that will be fufilled when the composer runtime has been upgraded,
     * or rejected otherwise.
     * @example
     * // Upgrade the Hyperledger Composer runtime
     * var adminConnection = new AdminConnection();
     * var businessNetworkDefinition = BusinessNetworkDefinition.fromArchive(myArchive);
     * return adminConnection.connect(connectionProfileName, upgradeId, upgradeSecret, businessNetworkDefinition.getName())
     * .then(() => {
     *      return adminConnection.upgrade();
     * })
     * .then(() => {
     *     // Business network definition upgraded
     * })
     * .catch((error) => {
     *     // Add optional error handling here.
     * });

     * @memberof AdminConnection
     */
    upgrade() {
        Util.securityCheck(this.securityContext);
        return this.connection.upgrade(this.securityContext);
    }

    /**
     * Test the connection to the runtime and verify that the version of the
     * runtime is compatible with this level of the node.js module.
     * @example
     * // Test the connection to the runtime
     * var adminConnection = new AdminConnection();
     * return adminConnection.ping()
     * .then(function(){
     *     // Connection has been tested
     * })
     * .catch(function(error){
     *     // Add optional error handling here.
     * });
     * @return {Promise} A promise that will be fufilled when the connection has
     * been tested. The promise will be rejected if the version is incompatible.
     */
    ping() {
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
    pingInner() {
        const method = 'pingInner';
        LOG.entry(method);
        Util.securityCheck(this.securityContext);
        return this.connection.ping(this.securityContext)
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
    activate() {
        const method = 'activate';
        LOG.entry(method);
        const json = {
            $class: 'org.hyperledger.composer.system.ActivateCurrentIdentity',
            transactionId: uuid.v4(),
            timestamp: new Date().toISOString()
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
     * var adminConnection = new AdminConnection();
     * return adminConnection.setLogLevel('DEBUG')
     * .then(() => {
     *     console.log('log level set to DEBUG');
     * })
     * .catch(function(error){
     *     // Add optional error handling here.
     * });
     *
     * @param {any} newLogLevel new logging level
     * @returns {Promise} A promise that resolves if successful.
     * @memberof AdminConnection
     */
    setLogLevel(newLogLevel) {
        Util.securityCheck(this.securityContext);
        return this.connection.invokeChainCode(this.securityContext, 'setLogLevel' , [newLogLevel]);
    }

    /**
     * Get the current logging level of a business network. The connection must
     * be connected for this method to succeed.
     * @example
     * // Get the current logging level of a business network.
     * var adminConnection = new AdminConnection();
     * return adminConnection.getLogLevel()
     * .then((currentLogLevel) => {
     *     console.log('current log level is ' + currentLogLevel);
     * })
     * .catch(function(error){
     *     // Add optional error handling here.
     * });
     *
     * @returns {Promise} A promise that resolves with the current logging level if successful.
     * @memberof AdminConnection
     */
    getLogLevel() {
        Util.securityCheck(this.securityContext);
        return this.connection.queryChainCode(this.securityContext, 'getLogLevel', [])
            .then((response) => {
                return Promise.resolve(JSON.parse(response));
            });
    }

    /**
     * List all of the deployed business networks. The connection must
     * be connected for this method to succeed.
     * @example
     * // List all of the deployed business networks.
     * var adminConnection = new AdminConnection();
     * return adminConnection.list()
     * .then((businessNetworks) => {
     *     // Connection has been tested
     *     return businessNetworks.forEach((businessNetwork) => {
     *       console.log('Deployed business network', businessNetwork);
     *     });
     * })
     * .catch(function(error){
     *     // Add optional error handling here.
     * });
     * @return {Promise} A promise that will be resolved with an array of
     * business network identifiers, or rejected with an error.
     */
    list() {
        Util.securityCheck(this.securityContext);
        return this.connection.list(this.securityContext);
    }

    /**
     * Import an identity into a profiles' wallet. No connection needs to be established
     * for this method to succeed.
    * @example
     * // Import an identity into a profiles' wallet
     * var adminConnection = new AdminConnection();
     * return adminConnection.importIdentity('hlfv1', 'PeerAdmin', certificate, privateKey)
     * .then(() => {
     *     // Identity imported
     *     console.log('identity imported successfully');
     * })
     * .catch(function(error){
     *     // Add optional error handling here.
     * });
     *
     * @param {string} connectionProfile Name of the connection profile
     * @param {string} id The id to associate with this identity
     * @param {string} certificate The signer cert in PEM format
     * @param {string} privateKey The private key in PEM format
     * @returns {Promise} A promise which is resolved when the identity is imported
     */
    importIdentity(connectionProfile, id, certificate, privateKey) {
        let savedConnectionManager;
        return this.connectionProfileManager.getConnectionManager(connectionProfile)
            .then((connectionManager) => {
                savedConnectionManager = connectionManager;
                return this.getProfile(connectionProfile);
            })
            .then((profileData) => {
                return savedConnectionManager.importIdentity(connectionProfile, profileData, id, certificate, privateKey);
            })
            .catch((error) => {
                throw new Error('failed to import identity. ' + error.message);
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
     * @param {string} connectionProfile Name of the connection profile
     * @param {string} enrollmentID The ID to enroll
     * @param {string} enrollmentSecret The secret for the ID
     * @returns {Promise} A promise which is resolved when the identity is imported
     */
    requestIdentity(connectionProfile, enrollmentID, enrollmentSecret) {
        let savedConnectionManager;
        return this.connectionProfileManager.getConnectionManager(connectionProfile)
            .then((connectionManager) => {
                savedConnectionManager = connectionManager;
                return this.getProfile(connectionProfile);
            })
            .then((profileData) => {
                return savedConnectionManager.requestIdentity(connectionProfile, profileData, enrollmentID, enrollmentSecret);
            })
            .catch((error) => {
                throw new Error('failed to request identity. ' + error.message);
            });
    }

   /**
     * Obtain the credentials associated with a given identity.
     * @param {String} connectionProfileName Name of the connection profile.
     * @param {String} id Name of the identity.
     * @return {Promise} Resolves to credentials in the form <em>{ certificate: String, privateKey: String }</em>.
     */
    exportIdentity(connectionProfileName, id) {
        let savedConnectionManager;
        return this.connectionProfileManager.getConnectionManager(connectionProfileName)
            .then((connectionManager) => {
                savedConnectionManager = connectionManager;
                return this.getProfile(connectionProfileName);
            })
            .then((profileData) => {
                return savedConnectionManager.exportIdentity(connectionProfileName, profileData, id);
            })
            .catch((cause) => {
                const error = new Error(`Failed to obtain credentials for ${id}: ${cause.message}`);
                error.cause = cause;
                throw error;
            });
    }
}

module.exports = AdminConnection;
