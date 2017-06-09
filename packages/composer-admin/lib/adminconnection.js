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
const FSConnectionProfileStore = require('composer-common').FSConnectionProfileStore;
const Util = require('composer-common').Util;

const fs = require('fs');

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
     * @param {Object} [options.fs] - specify an fs implementation to use.
     */
    constructor(options) {
        options = options || {};
        const fsConnectionProfileStore = new FSConnectionProfileStore(options.fs || fs);
        if (process.env.COMPOSER_CONFIG) {
            const envConnectionProfileStore = new EnvConnectionProfileStore();
            this.connectionProfileStore = new ComboConnectionProfileStore(
                fsConnectionProfileStore,
                envConnectionProfileStore
            );
        } else {
            this.connectionProfileStore = fsConnectionProfileStore;
        }
        this.connectionProfileManager = new ConnectionProfileManager(this.connectionProfileStore);
        this.connection = null;
        this.securityContext = null;
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
                    return this.connection.ping(this.securityContext);
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
     * @return {Promise} A promise that will be fufilled when the business network has been
     * deployed.
     */
    deploy(businessNetworkDefinition) {
        Util.securityCheck(this.securityContext);
        return this.connection.deploy(this.securityContext, true, businessNetworkDefinition);
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
        Util.securityCheck(this.securityContext);
        return this.connection.ping(this.securityContext);
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
     * import an identity into a profiles' wallet
     *
     * @param {string} connectionProfile Name of the connection profile
     * @param {string} id The id to associate with this identity
     * @param {string} publicKey The signer cert in PEM format
     * @param {string} privateKey The private key in PEM format
     * @returns {Promise} A promise which is resolved when the identity is imported
     *
     * @memberOf AdminConnection
     */
    importIdentity(connectionProfile, id, publicKey, privateKey) {
        let savedConnectionManager;
        return this.connectionProfileManager.getConnectionManager(connectionProfile)
            .then((connectionManager) => {
                savedConnectionManager = connectionManager;
                return this.getProfile(connectionProfile);
            })
            .then((profileData) => {
                return savedConnectionManager.importIdentity(profileData, id, publicKey, privateKey);
            })
            .catch((error) => {
                throw new Error('failed to import identity. ' + error.message);
            });
    }

}

module.exports = AdminConnection;
