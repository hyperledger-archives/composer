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

const LOG = require('composer-common').Logger.getLog('HFCConnection');
const Connection = require('composer-common').Connection;
const Globalize = require('composer-common').Globalize;
const HFCSecurityContext = require('./hfcsecuritycontext');
const HFCUtil = require('./hfcutil');
const packageJSON = require('../package.json');
const semver = require('semver');

/**
 * Class representing a connection to a business network running on Hyperledger
 * Fabric, using the hfc module.
 * @protected
 */
class HFCConnection extends Connection {

    /**
     * Constructor.
     * @param {ConnectionManager} connectionManager The owning connection manager.
     * @param {string} connectionProfile The name of the connection profile associated with this connection
     * @param {string} businessNetworkIdentifier The identifier of the business network for this connection,
     * or null if this connection if an admin connection
     * @param {hfc.Chain} chain A configured and connected {@link hfc.Chain} object.
     * @param {object} connectOptions The connection options in use by this connection.
     */
    constructor(connectionManager, connectionProfile, businessNetworkIdentifier, chain, connectOptions) {
        super(connectionManager, connectionProfile, businessNetworkIdentifier);

        if (!chain) {
            throw new Error('HFC chain must be set.');
        } else if (!connectOptions) {
            throw new Error('connectOptions not specified');
        }

        LOG.info('constructor', 'Creating connection', this.getIdentifier());
        this.chain = chain;
        this.connectOptions = connectOptions;

        this.composerEventId = null;
    }

    /**
     * Get the connection options for this connection.
     * @return {object} The connection options for this connection.
     */
    getConnectionOptions() {
        return this.connectOptions;
    }

    /**
     * Terminate the connection to the business network.
     * @return {Promise} A promise that is resolved once the connection has been
     * terminated, or rejected with an error.
     */
    disconnect() {
        // this.chain.getEventHub().unregisterChaincodeEvent(this.composerEventId);
        this.chain.eventHubDisconnect();
        this.businessNetworkIdentifier = null;
        this.connectionProfile = null;
        return Promise.resolve();
    }

    /**
     * Login as a participant on the business network.
     * @param {string} enrollmentID The enrollment ID of the participant.
     * @param {string} enrollmentSecret The enrollment secret of the participant.
     * @return {Promise} A promise that is resolved with a {@link SecurityContext}
     * object representing the logged in participant, or rejected with a login error.
     */
    login(enrollmentID, enrollmentSecret) {
        const self = this;
        LOG.info('login', 'Login attempt', self.businessNetworkIdentifier );

        if (!enrollmentID) {
            throw new Error(Globalize.formatMessage('concerto-login-noenrollmentid'));
        } else if (!enrollmentSecret) {
            throw new Error(Globalize.formatMessage('concerto-login-noenrollmentsecret'));
        }
        return new Promise((resolve, reject) => {
            self.chain.enroll(enrollmentID, enrollmentSecret, (error, enrolledMember) => {
                if (error) {
                    LOG.warn('login', 'Failed login', self.getIdentifier());
                    return reject(error);
                }
                self.chain.setRegistrar(enrolledMember);
                let result = new HFCSecurityContext(this);
                result.setUser(enrollmentID);
                result.setEnrolledMember(enrolledMember);
                result.setEventHub(self.chain.getEventHub());

                LOG.info('login', 'Successful login', self.getIdentifier());
                resolve(result);
            });
        })
            .then((securityContext) => {
                return self.getConnectionManager().getConnectionProfileManager().getConnectionProfileStore().load(self.connectionProfile)
                    .then((profile) => {
                        LOG.info('login', 'Loaded profile', JSON.stringify(profile) );

                        // This will not be set for admin connections.
                        if (self.businessNetworkIdentifier) {
                            let chaincodeID = null;
                            if (profile.networks) {
                                chaincodeID = profile.networks[self.businessNetworkIdentifier];
                                LOG.info('login', 'Loaded chaincode id for network ' + self.businessNetworkIdentifier, chaincodeID );
                            }

                            if (chaincodeID) {
                                securityContext.setChaincodeID(chaincodeID);
                            } else {
                                const msg = 'Failed to set chaincode id on security context. Check that the connection profile ' + self.connectionProfile + ' defines the network ' + self.businessNetworkIdentifier;
                                LOG.error('login', msg, self.getIdentifier());
                                throw new Error(msg);
                            }
                        }
                    })
                    .then(() => {
                        this.subscribeToEvents(securityContext.getChaincodeID());
                        return securityContext;
                    });
            });
    }

    /**
     * Start a business network definition.
     * @param {HFCSecurityContext} securityContext The participant's security context.
     * @param {BusinessNetwork} businessNetwork The BusinessNetwork to start
     * @param {Object} startOptions connector specific deployment options
     * @return {Promise} A promise that is resolved once the business network
     * artifacts have been deployed and the business network started, or rejected with an error.
     */
    start(securityContext, businessNetwork, startOptions) {
        HFCUtil.securityCheck(securityContext);
        const self = this;
        let chaincodeId = null;
        LOG.info('start', 'Starting business network', businessNetwork.getIdentifier());

        // check whether this client has already deployed this business network
        return self.getConnectionManager().getConnectionProfileManager().getConnectionProfileStore().load(self.connectionProfile)
            .then((profile) => {
                if (profile.networks && profile.networks[businessNetwork.getName()]) {
                    throw new Error('Connection profile ' + self.connectionProfile + ' already contains the deployed network ' + businessNetwork.getName() + '. You should clear your connection profile or perform a business network definition update instead.');
                }
                return businessNetwork.toArchive();
            })
            .then((buffer) => {
                const initArgs = {};
                return HFCUtil
                    .deployChainCode(securityContext, 'concerto', 'init', [buffer.toString('base64'), JSON.stringify(initArgs)], true);
            })
            .then((result) => {
                LOG.info('start', 'Deployed chaincode', result.chaincodeID);
                chaincodeId = result.chaincodeID;
                return securityContext.setChaincodeID(result.chaincodeID);
            })
            // we now need to update the connection profile with the chaincode id
            // for this business network
            .then(() => {
                return self.getConnectionManager().getConnectionProfileManager().getConnectionProfileStore().load(self.connectionProfile);
            })
            .then((profile) => {
                if (!profile.networks) {
                    profile.networks = {};
                }
                profile.networks[businessNetwork.getName()] = chaincodeId;
                return self.connectionManager.getConnectionProfileManager().getConnectionProfileStore().save(self.connectionProfile, profile);
            })
            .then(() => {
                LOG.info('start', 'Updated connection profile with chaincode id', self.getIdentifier());
                // note that we do NOT set self.businessNetworkIdentifier
                // here as that would change the identity of this admin connection
                // causing an exception when the connection is disconncted due to a
                // missing chain pool entry in the connection manager
                return self.ping(securityContext);
            });
    }

    /**
     * Undeploy a business network definition.
     * @abstract
     * @param {SecurityContext} securityContext The participant's security context.
     * @param {string} businessNetworkIdentifier The identifier of the business network to remove
     * @return {Promise} A promise that is resolved once the business network
     * artifacts have been undeployed, or rejected with an error.
     */
    undeploy(securityContext, businessNetworkIdentifier) {
        HFCUtil.securityCheck(securityContext);
        const self = this;
        let profile = null;

        if (!businessNetworkIdentifier) {
            throw new Error('Business network id must be specified.');
        }

        return self.getConnectionManager().getConnectionProfileManager().getConnectionProfileStore().load(self.connectionProfile)
            .then((prof) => {
                profile = prof;
            })
            .then(() => {
                return HFCUtil
                    .invokeChainCode(securityContext, 'undeployBusinessNetwork', []);
            })
            .then(() => {
                try {
                    delete profile.networks[businessNetworkIdentifier];
                    LOG.info('undeploy', 'Removed connection profile', self.getIdentifier());
                    return self.getConnectionManager().getConnectionProfileManager().getConnectionProfileStore().save(self.connectionProfile, profile);
                } catch (err) {
                    // we just log this as a warning as the business network may
                    // not have been deployed from this machine
                    LOG.warn('undeploy', 'Failed to remove reference to business network ' + businessNetworkIdentifier + ' from connection profile', self.getIdentifier());
                }
            });
    }

    /**
     * Updates an existing deployed business network definition.
     * @abstract
     * @param {SecurityContext} securityContext The participant's security context.
     * @param {BusinessNetworkDefinition} businessNetworkDefinition The BusinessNetworkDefinition to deploy
     * @return {Promise} A promise that is resolved once the business network
     * artifacts have been updated, or rejected with an error.
     */
    update(securityContext, businessNetworkDefinition) {
        HFCUtil.securityCheck(securityContext);

        return businessNetworkDefinition.toArchive()
            .then((buffer) => {
                return HFCUtil
                    .invokeChainCode(securityContext, 'updateBusinessNetwork', [buffer.toString('base64')]);
            });
    }

    /**
     * Test ("ping") the connection to the business network.
     * @param {HFCSecurityContext} securityContext The participant's security context.
     * @return {Promise} A promise that is resolved once the connection to the
     * business network has been tested, or rejected with an error.
     */
    ping(securityContext) {
        HFCUtil.securityCheck(securityContext);
        return HFCUtil.queryChainCode(securityContext, 'ping', [])
            .then((buffer) => {
                return JSON.parse(buffer.toString());
            })
            .then((response) => {
                // Is the runtime using a prerelease version?
                const connectorVersion = packageJSON.version;
                const runtimeVersion = response.version;
                const prerelease = (semver.prerelease(runtimeVersion) !== null);
                // If the runtime is using a prerelease version, then we must exactly match that version.
                // If the runtime is using a normal version, then our client version should be greater than or equal.
                const range = (prerelease ? runtimeVersion : `^${runtimeVersion}`);
                if (!semver.satisfies(connectorVersion, range)) {
                    LOG.error('ping', 'Version mismatch', connectorVersion, runtimeVersion, range);
                    throw new Error(`Deployed chain-code (${response.version}) is incompatible with client (${connectorVersion})`);
                } else {
                    LOG.info('ping', 'Successful ping', connectorVersion, runtimeVersion, range);
                }
                return response;
            });
    }

    /**
     * Invoke a "query" chaincode function with the specified name and arguments.
     * @param {SecurityContext} securityContext The participant's security context.
     * @param {string} functionName The name of the chaincode function to invoke.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @return {Promise} A promise that is resolved with the data returned by the
     * chaincode function once it has been invoked, or rejected with an error.
     */
    queryChainCode(securityContext, functionName, args) {
        HFCUtil.securityCheck(securityContext);
        LOG.info('queryChainCode', 'Function ' + functionName, args);
        return HFCUtil.queryChainCode(securityContext, functionName, args);
    }

    /**
     * Invoke a "invoke" chaincode function with the specified name and arguments.
     * @param {SecurityContext} securityContext The participant's security context.
     * @param {string} functionName The name of the chaincode function to invoke.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @return {Promise} A promise that is resolved once the chaincode function
     * has been invoked, or rejected with an error.
     */
    invokeChainCode(securityContext, functionName, args) {
        HFCUtil.securityCheck(securityContext);
        LOG.info('invokeChainCode', 'Function ' + functionName, args);
        return HFCUtil.invokeChainCode(securityContext, functionName, args);
    }

    /**
     * Create a new identity for the specified user ID.
     * @param {SecurityContext} securityContext The participant's security context.
     * @param {string} userID The user ID.
     * @param {object} [options] Options for the new identity.
     * @param {boolean} [options.issuer] Whether or not the new identity should have
     * permissions to create additional new identities. False by default.
     * @param {string} [options.affiliation] Specify the affiliation for the new
     * identity. Defaults to 'institution_a'.
     * @return {Promise} A promise that is resolved with a generated user
     * secret once the new identity has been created, or rejected with an error.
     */
    createIdentity(securityContext, userID, options) {
        const method = 'createIdentity';
        LOG.entry(method, securityContext, userID, options);
        HFCUtil.securityCheck(securityContext);
        return HFCUtil.createIdentity(securityContext, userID, options)
            .then((enrollmentSecret) => {
                LOG.exit(method);
                return enrollmentSecret;
            });
    }

    /**
     * List all of the deployed business networks. The connection must
     * be connected for this method to succeed.
     * @param {SecurityContext} securityContext The participant's security context.
     * @return {Promise} A promise that will be resolved with an array of
     * business network identifiers, or rejected with an error.
     */
    list(securityContext) {
        return this.getConnectionManager().getConnectionProfileManager().getConnectionProfileStore().load(this.connectionProfile)
            .then((profile) => {
                profile.networks = profile.networks || {};
                return Object.keys(profile.networks).sort();
            });
    }

    /**
     * Subscribe to events emitted by transactions
     * @param {String} chaincodeID The chaincode ID
     */
    subscribeToEvents(chaincodeID) {
        if (this.chain.getEventHub() && chaincodeID) {
            LOG.entry('registerChaincodeEvent', chaincodeID, 'composer');
            this.composerEventId = this.chain.getEventHub().registerChaincodeEvent(chaincodeID, 'composer', (event) => {
                const jsonEvent = JSON.parse(event.payload.toString('utf8'));
                this.emit('events', jsonEvent);
            });
        }
    }

   /**
     * Deploy a business network. For the hlf connector this just translates to
     * a start request as no install is required.
     * @param {HFCSecurityContext} securityContext The participant's security context.
     * @param {BusinessNetwork} businessNetwork The BusinessNetwork to deploy
     * @param {Object} deployOptions connector specific deploy options
     * @return {Promise} A promise that is resolved once the business network
     * artifacts have been deployed, or rejected with an error.
     */
    deploy(securityContext, businessNetwork, deployOptions) {
        return this.start(securityContext, businessNetwork, deployOptions);
    }

    /**
     * For the hlf connector, this is just a no-op, there is nothing to install
     * @param {SecurityContext} securityContext The participant's security context.
     * @param {string} businessNetworkIdentifier The identifier of the Business network that will be started in this installed runtime
     * @param {Object} installOptions connector specific install options
     * @return {Promise} An already resolved promise
     */
    install(securityContext, businessNetworkIdentifier, installOptions) {
        return Promise.resolve();
    }
}

module.exports = HFCConnection;
