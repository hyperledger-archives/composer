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

const BusinessNetworkRegistry = require('./businessnetworkregistry');

const Globalize = require('./globalize');
const Util = require('./util');
const hfc = require('hfc');

/**
 * <p>
 * Manages a set of deployed business networks
 * </p>
 */
class ManagementConnection {

  /**
   * Create an instance of the BusinessNetworkRegistry class.
   * @param {string} enrollmentID - the enrollmentID to use for connection
   * @param {string} enrollmentSecret - the enrollmentSecret to use for connection
   * @param {object} connectOptions - the connection options
   */
    constructor(enrollmentID, enrollmentSecret, connectOptions) {
        this.enrollmentID = enrollmentID;
        this.enrollmentSecret = enrollmentSecret;
        this.enrolledMember = null;
        this.connectOptions = connectOptions;
        this.chain = null;
        this.developmentMode = false;
        this.connectOptios = connectOptions;
        if (connectOptions && connectOptions.developmentMode) {
            this.developmentMode = true;
        }
        this.businessNetworkRegistry = new BusinessNetworkRegistry(this);
    }

    /**
     * Create the BusinessNetworkRegistry.
     * <p>
     * <strong>Note: Only to be called by framework code.</strong>
     * </p>
     * @return {Promise} A promise that to the BusinessNetworkRegistry
     */
    connect() {
        let self = this;
        if (!self.connectOptions) {
            throw new Error(Globalize.formatMessage('concerto-connect-noconopts'));
        } else if (!self.connectOptions.keyValStore) {
            throw new Error(Globalize.formatMessage('concerto-connect-nokeyvalstore'));
        } else if (!self.connectOptions.membershipServicesURL) {
            throw new Error(Globalize.formatMessage('concerto-connect-nomembersrvcurl'));
        } else if (!self.connectOptions.peerURL) {
            throw new Error(Globalize.formatMessage('concerto-connect-nopeerurl'));
        } else if (!self.connectOptions.eventHubURL) {
            throw new Error(Globalize.formatMessage('concerto-connect-noeventhuburl'));
        }
        self.chain = hfc.getChain('Concerto', true);
        self.chain.setKeyValStore(hfc.newFileKeyValStore(self.connectOptions.keyValStore));
        self.chain.setMemberServicesUrl(self.connectOptions.membershipServicesURL);
        self.chain.addPeer(self.connectOptions.peerURL);
        if (self.connectOptions.deployWaitTime) {
            self.chain.setDeployWaitTime(self.connectOptions.deployWaitTime);
        }
        if (self.connectOptions.invokeWaitTime) {
            self.chain.setInvokeWaitTime(self.connectOptions.invokeWaitTime);
        }
        self.chain.eventHubConnect(self.connectOptions.eventHubURL);
        process.on('exit', () => {
            if (self.chain) {
                self.chain.eventHubDisconnect();
                self.chain = null;
            }
        });

        return this.login().then(() => {
            return new BusinessNetworkRegistry(self);
        });
    }

    /**
     * Disconnects from the Hyperledger Fabric.
     * @return {Promise} A promise that will be resolved when the connection is
     * terminated.
     */
    disconnect() {
        let self = this;
        return new Promise(function (resolve, reject) {
            if (self.chain) {
                self.chain.eventHubDisconnect();
                self.chain = null;
            }
            self.enrolledMember = null;
            resolve();
        });
    }

    /**
     * Log in to the Hyperledger Fabric as the specified user
     *
     * @param {string} enrollmentID the enrollment ID of the user
     * @param {string} enrollmentSecret the enrollment secret of the user
     * @return {Promise} A promise that will be resolved with a {SecurityContext}
     * when the the security context
     * @private
     */
    login(enrollmentID, enrollmentSecret) {
        let self = this;
        if (!enrollmentID) {
            throw new Error(Globalize.formatMessage('concerto-login-noenrollmentid'));
        } else if (!enrollmentSecret) {
            throw new Error(Globalize.formatMessage('concerto-login-noenrollmentsecret'));
        }
        return new Promise(function (resolve, reject) {
            self.chain.enroll(enrollmentID, enrollmentSecret, function (error, enrolledMember) {
                if (error) {
                    return reject(error);
                }
                self.enrolledMember(enrolledMember);
                resolve(self);
            });
        });
    }

    /**
     * Deploys the Concerto chain-code to the Hyperledger Fabric.
     * @param {boolean} [force] - Force a new instance of the chain-code to deploy.
     * @return {Promise} A promise that will be fufilled when the chain-code has
     * been deployed.
     */
    deploy(force) {
        let self = this;
        if (!self.isConnected()) {
            throw new Error(Globalize.formatMessage('concerto-deploy-nosecuritycontext'));
        }
        return Util
            .deployChainCode(self, 'concerto', 'init', [this.developmentMode.toString()], force)
            .then(function (result) {
                this.chaincodeID(result.chaincodeID);
                return self.ping();
            });
    }

    /**
     * Returns true if the business network registry is connected to the server
     * @return {boolean} true if the business network registry is connected to the sever
     */
    isConnected() {
        return this.enrolledMember !== null;
    }
}

module.exports = ManagementConnection;
