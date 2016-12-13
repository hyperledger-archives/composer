/*
 * IBM Confidential
 * OCO Source Materials
 * IBM Concerto - Blockchain Solution Framework
 * Copyright IBM Corp. 2016
 * The source code for this program is not published or otherwise
 * divested of its trade secrets, irrespective of what has
 * been deposited with the U.S. Copyright Office.
 */

'use strict';

const LOG = require('@ibm/ibm-concerto-common').Logger.getLog('HFCConnection');
const Connection = require('@ibm/ibm-concerto-common').Connection;
const Globalize = require('@ibm/ibm-concerto-common').Globalize;
const HFCSecurityContext = require('./hfcsecuritycontext');
const HFCUtil = require('./hfcutil');
const version = require('../package.json').version;

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
     */
    constructor(connectionManager, connectionProfile, businessNetworkIdentifier, chain) {
        super(connectionManager, connectionProfile, businessNetworkIdentifier);

        if (!chain) {
            throw new Error('HFC chain must be set.');
        }

        LOG.info('constructor', 'Creating connection', this.getIdentifier());
        this.chain = chain;
    }

    /**
     * Terminate the connection to the business network.
     * @return {Promise} A promise that is resolved once the connection has been
     * terminated, or rejected with an error.
     */
    disconnect() {
        const self = this;
        return self.getConnectionManager().onDisconnect(self)
            .then(() => {
                return new Promise((resolve, reject) => {
                    self.businessNetworkIdentifier = null;
                    self.connectionProfile = null;
                    resolve();
                });
            });
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
                            let chaincodeID = profile.networks[self.getBusinessNetworkName()];
                            LOG.info('login', 'Loaded chaincode id for network ' + self.getBusinessNetworkName(), chaincodeID );

                            if (chaincodeID) {
                                securityContext.setChaincodeID(chaincodeID);
                            } else {
                                const msg = 'Failed to set chaincode id on security context. Check that the connection profile ' + self.connectionProfile + ' defines the network ' + self.getBusinessNetworkName();
                                LOG.error('login', msg, self.getIdentifier());
                                throw new Error(msg);
                            }
                        }
                    })
                    .then(() => {
                        return securityContext;
                    });
            });
    }

    /**
     * Deploy all business network artifacts.
     * @param {HFCSecurityContext} securityContext The participant's security context.
     * @param {boolean} [force] Force the deployment of the business network artifacts.
     * @param {BusinessNetwork} businessNetwork The BusinessNetwork to deploy
     * @return {Promise} A promise that is resolved once the business network
     * artifacts have been deployed, or rejected with an error.
     */
    deploy(securityContext, force, businessNetwork) {
        HFCUtil.securityCheck(securityContext);
        const self = this;
        let chaincodeId = null;
        LOG.info('deploy', 'Deploying business network', businessNetwork.getIdentifier());

        // check whether this client has already deployed this business network
        return self.getConnectionManager().getConnectionProfileManager().getConnectionProfileStore().load(self.connectionProfile)
            .then((profile) => {
                if (profile.networks && profile.networks[businessNetwork.getName()]) {
                    throw new Error('Connection profile ' + self.connectionProfile + ' already contains the deployed network ' + businessNetwork.getName() + '. You should clear your connection profile or perform a business network definition update instead.');
                }
                return businessNetwork.toArchive();
            })
            .then((buffer) => {
                return HFCUtil
                    .deployChainCode(securityContext, 'concerto', 'init', [buffer.toString('base64')], force);
            })
            .then((result) => {
                LOG.info('deploy', 'Deployed chaincode', result.chaincodeID);
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
                LOG.info('deploy', 'Updated connection profile with chaincode id', self.getIdentifier());
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
                    .invokeChainCode(securityContext, 'undeploy', [businessNetworkIdentifier]);
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
                    .invokeChainCode(securityContext, 'update', [buffer.toString('base64')]);
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
                if (response.version !== version) {
                    LOG.error('ping', 'Version mismatch', response.version);
                    throw new Error(`Deployed chain-code (${response.version}) is incompatible with client (${version})`);
                } else {
                    LOG.info('ping', 'Successful ping', response.version);
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

}

module.exports = HFCConnection;
