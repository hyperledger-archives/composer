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
const Logger = require('composer-common').Logger;
const FABRIC_CONSTANTS = require('fabric-client/lib/Constants');

const LOG = Logger.getLog('HLFQueryHandler');

/**
 * Class to provide intelligence on how to query peers when peers are not available.
 * This is an initial implementation which could iterate and perhaps be pushed back
 * into the fabric node-sdk in future
 *
 * The current implementation creates a list of query peers. The top of the list
 * contains peers for the callers org, followed by peers in all other orgs.
 * It will search through the list looking for a peer to respond successfully to
 * a query then remember that peer, until it fails, then it will start looking
 * for a new peer from the top of the list, ignoring the one that just failed.
 * @private
 */
class HLFQueryHandler {

    /**
     * constructor
     * @param {HLFConnection} connection the connection to the hlfv1 fabric
     */
    constructor(connection) {
        const method = 'constructor';
        LOG.entry(method);
        this.allQueryPeers = connection.getChannelPeersInOrg([FABRIC_CONSTANTS.NetworkConfig.CHAINCODE_QUERY_ROLE]);
        this.queryPeerIndex = -1;

        this.connection = connection;
        LOG.exit(method);
    }

    /**
     * Query Chaincode using the following rules
     * 1. try the last successful peer
     * 2. If that fails or this is the first time try all query peers in order
     * Currently the implementation restricts to only peers in the same organisation, not across the channel.
     * @param {TransactionID} txId the transaction id to use
     * @param {string} functionName the function name to invoke
     * @param {string[]} args the arguments
     * @returns {object} asynchronous response or async error.
     */
    async queryChaincode(txId, functionName, args) {
        const method = 'queryChaincode';
        LOG.entry(method, txId, functionName, args);
        let success = false;
        let payload;
        let allErrors = [];

        if (this.allQueryPeers.length === 0) {
            const newError = new Error('No peers have been provided that can be queried');
            LOG.error(method, newError);
            throw newError;
        }

        // try the last successful peer
        if (this.queryPeerIndex !== -1) {
            let peer = this.allQueryPeers[this.queryPeerIndex];
            try {
                payload = await this.querySinglePeer(peer, txId, functionName, args);
                success = true;
            } catch (error) {
                allErrors.push(error);
                LOG.warn(method, `Peer ${peer} failed to respond. ${error}`);
            }
        }

        if (!success) {

            // last successful peer failed or this is the first attempt at any query, so try to find a
            // peer to query.
            let failedPeer = this.queryPeerIndex;  // could be -1 if first attempt
            this.queryPeerIndex = -1;
            for (let i = 0; i < this.allQueryPeers.length && !success; i++) {
                if (i === failedPeer) {
                    continue;
                }
                let peer = this.allQueryPeers[i];
                try {
                    payload = await this.querySinglePeer(peer, txId, functionName, args);
                    this.queryPeerIndex = i;
                    success = true;
                    break;
                } catch (error) {
                    allErrors.push(error);
                    LOG.warn(method, `Peer ${peer.getName()} failed to respond. ${error}`);
                }
            }
        }

        if (!success) {
            const newError = new Error(`No peers available to query. last error was ${allErrors[allErrors.length-1]}`);
            LOG.error(method, newError);
            throw newError;
        }

        if (payload instanceof Error) {
            LOG.warn(method, 'query payload returned an error: ' + payload);
            throw payload;
        }

        LOG.exit(method, payload);
        return payload;

    }

    /**
     * Send a query
     * @param {Peer} peer The peer to query
     * @param {TransactionID} txId the transaction id to use
     * @param {string} functionName the function name of the query
     * @param {array} args the arguments to ass
     * @returns {Buffer} asynchronous response to query
     */
    async querySinglePeer(peer, txId, functionName, args) {
        const method = 'querySinglePeer';
        LOG.entry(method, peer, txId, functionName, args);
        const request = {
            targets: [peer],
            chaincodeId: this.connection.businessNetworkIdentifier,
            txId: txId,
            fcn: functionName,
            args: args
        };

        let payloads = await this.connection.channel.queryByChaincode(request);
        LOG.debug(method, `Received ${payloads.length} payloads(s) from querying the composer runtime chaincode`, payloads);
        if (!payloads.length) {
            LOG.error(method, 'No payloads were returned from the query request:' + functionName);
            throw new Error('No payloads were returned from the query request:' + functionName);
        }
        const payload = payloads[0];

        // if it has a code value is 14, means unavailable, so throw that error
        // code 2 looks like it is a chaincode response that was an error.
        if (payload instanceof Error && payload.code && payload.code === 14) {
            throw payload;
        }

        LOG.exit(method, payload);
        return payload;

    }
}

module.exports = HLFQueryHandler;

