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
     * @param {string} businessNetworkIdentifier The identifier of the business network for this connection
     * @param {hfc.Chain} chain A configured and connected {@link hfc.Chain} object.
     */
    constructor(connectionManager, connectionProfile, businessNetworkIdentifier, chain) {
        super(connectionManager, connectionProfile, businessNetworkIdentifier);
        this.chain = chain;
    }

    /**
     * Terminate the connection to the business network.
     * @return {Promise} A promise that is resolved once the connection has been
     * terminated, or rejected with an error.
     */
    disconnect() {
        return new Promise((resolve, reject) => {
            if (this.chain) {
                this.chain.eventHubDisconnect();
                this.chain = null;
                this.businessNetworkIdentifier = null;
                this.connectionProfile  = null;
            }
            resolve();
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
        if (!enrollmentID) {
            throw new Error(Globalize.formatMessage('concerto-login-noenrollmentid'));
        } else if (!enrollmentSecret) {
            throw new Error(Globalize.formatMessage('concerto-login-noenrollmentsecret'));
        }
        return new Promise((resolve, reject) => {
            this.chain.enroll(enrollmentID, enrollmentSecret, (error, enrolledMember) => {
                if (error) {
                    return reject(error);
                }
                let result = new HFCSecurityContext(this);
                result.setUser(enrollmentID);
                result.setEnrolledMember(enrolledMember);
                result.setEventHub(this.chain.getEventHub());
                resolve(result);
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

        // TODO (DCS) write business network toArchive and Base64 encode here
        const archiveData = 0x1deadbeef;
        return HFCUtil
            .deployChainCode(securityContext, 'concerto', 'init', [archiveData], force)
            .then((result) => {
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
                profile.networks[self.businessNetworkIdentifier] = chaincodeId;
                return self.connectionManager.getConnectionProfileManager().getConnectionProfileStore().save(self.connectionProfile, profile);
            })
            .then(() => {
                return self.ping(securityContext);
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
                     throw new Error(`Deployed chain-code (${response.version}) is incompatible with client (${version})`);
                 }
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
        return HFCUtil.invokeChainCode(securityContext, functionName, args);
    }

}

module.exports = HFCConnection;
