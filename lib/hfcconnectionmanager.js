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

const ConnectionManager = require('@ibm/ibm-concerto-common').ConnectionManager;
const Globalize = require('@ibm/ibm-concerto-common').Globalize;
const hfc = require('hfc');
const HFCConnection = require('./hfcconnection');

/**
 * Class representing a connection manager that establishes and manages
 * connections to one or more business networks running on Hyperledger Fabric,
 * using the hfc module.
 * @protected
 */
class HFCConnectionManager extends ConnectionManager {

    /**
     * Creates a new HFCConnectionManager
     * @param {fs} fs - the file system to load the connection profiles from
     */
    constructor(fs) {
        super(fs);
    }

    /**
     * Establish a connection to the business network.
     * @param {string} connectionProfile The name of the connection profile
     * @param {string} businessNetworkIdentifier The identifier of the business network
     * @return {Promise} A promise that is resolved with a {@link Connection}
     * object once the connection is established, or rejected with a connection error.
     */
    connect(connectionProfile, businessNetworkIdentifier) {

        return this.loadConnectionProfile(connectionProfile)
        .catch((err) => {
            throw new Error(Globalize.formatMessage('concerto-connect-noconopts'));
        })
        .then((connectOptions) => {
            if (!connectOptions.keyValStore) {
                throw new Error(Globalize.formatMessage('concerto-connect-nokeyvalstore'));
            } else if (!connectOptions.membershipServicesURL) {
                throw new Error(Globalize.formatMessage('concerto-connect-nomembersrvcurl'));
            } else if (!connectOptions.peerURL) {
                throw new Error(Globalize.formatMessage('concerto-connect-nopeerurl'));
            } else if (!connectOptions.eventHubURL) {
                throw new Error(Globalize.formatMessage('concerto-connect-noeventhuburl'));
            }
            return new Promise((resolve, reject) => {
                let chain = hfc.getChain('Concerto', true);
                chain.setKeyValStore(hfc.newFileKeyValStore(connectOptions.keyValStore));
                chain.setMemberServicesUrl(connectOptions.membershipServicesURL);
                chain.addPeer(connectOptions.peerURL);
                if (connectOptions.deployWaitTime) {
                    chain.setDeployWaitTime(connectOptions.deployWaitTime);
                }
                if (connectOptions.invokeWaitTime) {
                    chain.setInvokeWaitTime(connectOptions.invokeWaitTime);
                }
                chain.eventHubConnect(connectOptions.eventHubURL);
                process.on('exit', () => {
                    if (chain) {
                        chain.eventHubDisconnect();
                        chain = null;
                    }
                });
                resolve(new HFCConnection(this, connectionProfile, businessNetworkIdentifier, chain));
            });
        });
    }
}

module.exports = HFCConnectionManager;
