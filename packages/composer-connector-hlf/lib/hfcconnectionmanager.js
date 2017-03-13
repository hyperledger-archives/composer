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

const ConnectionManager = require('composer-common').ConnectionManager;
const Globalize = require('composer-common').Globalize;
const hfc = require('hfc');
const HFCConnection = require('./hfcconnection');
const HFCWalletProxy = require('./hfcwalletproxy');
const LOG = require('composer-common').Logger.getLog('HFCConnectionManager');
const Wallet = require('composer-common').Wallet;

/**
 * Class representing a connection manager that establishes and manages
 * connections to one or more business networks running on Hyperledger Fabric,
 * using the hfc module.
 * @private
 */
class HFCConnectionManager extends ConnectionManager {

    /**
     * Creates a new HFCConnectionManager
     * @param {ConnectionProfileManager} connectionProfileManager
     * - the ConnectionProfileManager used to manage access connection profiles.
     */
    constructor(connectionProfileManager) {
        super(connectionProfileManager);
        this.chainPool = {};
    }

    /**
     * Called when a connection is closed.
     * @param {Connection} connection - the connection being closed.
     * @return {Promise} A promise that is resolved once the connection has been
     * terminated, or rejected with an error.
     * @private
     */
    onDisconnect(connection) {

        let chainReference = this.chainPool[connection.getIdentifier()];
        if(!chainReference) {
            throw new Error('Connection was not created by connection manager ' + connection.getIdentifier() );
        }
        else {
            chainReference.count--;
            if(chainReference.count < 0) {
                throw new Error('Connection already closed ' + connection.getIdentifier() );
            }
        }

        return Promise.resolve(true);
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
        const self = this;
        let chainIdentifier = connectionProfile;

        if(businessNetworkIdentifier) {
            chainIdentifier = businessNetworkIdentifier + '@' + chainIdentifier;
        }
        LOG.debug(method, 'Chain identifier', chainIdentifier);

        let chainReference = this.chainPool[chainIdentifier];

        if(chainReference) {
            LOG.info('connect','Returning connection with pooled HFC chain', chainIdentifier);
            chainReference.count++;
            const connection = new HFCConnection(self, connectionProfile, businessNetworkIdentifier, chainReference.chain, connectOptions);
            LOG.exit(method, connection);
            return Promise.resolve(connection);
        }
        else {
            LOG.info('connect','Creating new HFC chain for ' + chainIdentifier, JSON.stringify(connectOptions));

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
                let chain = hfc.getChain(chainIdentifier, true);
                let wallet = Wallet.getWallet();
                if (wallet) {
                    chain.setKeyValStore(new HFCWalletProxy(wallet));
                } else {
                    chain.setKeyValStore(hfc.newFileKeyValStore(connectOptions.keyValStore));
                }
                let grpcOptions = {};
                // Check to see if a certificate has been specified.
                if (connectOptions.certificate) {
                    // Check to see that the certificate is not just whitespace.
                    let certificate = connectOptions.certificate.trim();
                    if (certificate) {
                        // Certificates *must* end with a trailing newline.
                        certificate += '\n';
                        grpcOptions.pem = certificate;
                    }
                }
                LOG.debug(method, 'GRPC options', grpcOptions);
                chain.setMemberServicesUrl(connectOptions.membershipServicesURL, grpcOptions);
                chain.addPeer(connectOptions.peerURL, grpcOptions);
                if (connectOptions.deployWaitTime) {
                    chain.setDeployWaitTime(connectOptions.deployWaitTime);
                }
                if (connectOptions.invokeWaitTime) {
                    chain.setInvokeWaitTime(connectOptions.invokeWaitTime);
                }
                chain.eventHubConnect(connectOptions.eventHubURL, grpcOptions);
                process.on('exit', () => {
                    if (chain) {
                        chain.eventHubDisconnect();
                        chain = null;
                    }
                });
                const connection = new HFCConnection(self, connectionProfile, businessNetworkIdentifier, chain, connectOptions);
                this.chainPool[chainIdentifier] = {count: 1, chain: chain};
                LOG.exit(method, connection);
                resolve(connection);
            });
        }
    }
}

module.exports = HFCConnectionManager;
