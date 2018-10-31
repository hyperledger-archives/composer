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
        LOG.entry(method, peer.getName(), txId, functionName, args);
        const request = {
            targets: [peer],
            chaincodeId: this.connection.businessNetworkIdentifier,
            txId: txId,
            fcn: functionName,
            args: args
        };

        const t0 = Date.now();
        let payloads = await this.queryByChaincode(request);
        LOG.perf(method, `Total duration for queryByChaincode to ${functionName}: `, txId, t0);
        LOG.debug(method, `Received ${payloads.length} payloads(s) from querying the composer runtime chaincode`);
        if (!payloads.length) {
            LOG.error(method, 'No payloads were returned from the query request:' + functionName);
            throw new Error('No payloads were returned from the query request:' + functionName);
        }
        const payload = payloads[0];

        //
        // need to also handle the grpc error codes as before, but now need to handle the change in the
        // node-sdk with a horrible match a string error, but would need a fix to node-sdk to resolve.
        // A Fix is in 1.3
        if (payload instanceof Error && (
                (payload.code && (payload.code === 14 || payload.code === 1 || payload.code === 4)) ||
                (payload.message.match(/Failed to connect before the deadline/))
            )) {
            throw payload;
        }

        LOG.exit(method, payload);
        return payload;

    }

    /**
     * Perform a chaincode query and parse the responses.
     * @param {object} request the proposal for a query
     * @return {array} the responses
     */
    async queryByChaincode(request) {
        const method = 'queryByChaincode';
        LOG.entry(method, request);
        try {
            const results = await this.connection.channel.sendTransactionProposal(request);
            const responses = results[0];
            if (responses && Array.isArray(responses)) {
                let results = [];
                for (let i = 0; i < responses.length; i++) {
                    let response = responses[i];
                    if (response instanceof Error) {
                        results.push(response);
                    }
                    else if (response.response && response.response.payload) {
                        results.push(response.response.payload);
                    }
                    else {
                        results.push(new Error(response));
                    }
                }
                LOG.exit(method);
                return results;
            }
            const err = new Error('Payload results are missing from the chaincode query');
            LOG.error(method, err);
            throw err;
        } catch(err) {
            LOG.error(method, err);
            throw err;
        }
    }
}

module.exports = HLFQueryHandler;

