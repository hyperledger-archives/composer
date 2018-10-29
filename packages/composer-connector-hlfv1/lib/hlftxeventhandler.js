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
const HLFUtil = require('./hlfutil');

const LOG = Logger.getLog('HLFTxEventHandler');

/**
 * Class representing a connection to a business network running on Hyperledger
 * Fabric, using the hfc module.
 * @protected
 */
class HLFTxEventHandler {

    /**
     * Construct a Tx Event Handler.
     * @param {EventHub[]} eventHubs the event hubs to listen for tx events
     * @param {String} txId the txid that is driving the events to occur
     * @param {Integer} timeout how long (in seconds) to wait for events to occur.
     * @param {Integer} requiredEventHubs number of required event hubs, either 0 or 1, default to 0
     * for old composer be
     */
    constructor(eventHubs, txId, timeout, requiredEventHubs = 1) {
        const method = 'constructor';
        // Don't log the eventHub objects they are too large
        LOG.entry(method, txId, timeout, requiredEventHubs);
        this.eventHubs = eventHubs || [];
        this.txId = txId || '';
        this.listenerPromises = [];
        this.timeoutHandles = [];
        this.timeout = timeout || 0;
        this.responseCount = 0;
        this.requiredEventHubs = requiredEventHubs;
        LOG.exit(method);
    }

    /**
     * Start listening for events.
     */
    startListening() {
        const method = 'startListening';
        LOG.entry(method);

        this.eventHubs.forEach((eh) => {
            if (HLFUtil.eventHubConnected(eh)) {

                let handle;
                let txPromise = new Promise((resolve, reject) => {
                    handle = setTimeout(() => {
                        eh.unregisterTxEvent(this.txId);

                        // We reject to let the application know that the commit did not complete within the timeout
                        const timeoutMsg = `Failed to receive commit notification from ${eh.getPeerAddr()} for transaction '${this.txId}' within the timeout period`;
                        LOG.error(method, timeoutMsg);
                        reject(new Error(timeoutMsg));
                    }, this.timeout);

                    eh.registerTxEvent(this.txId,
                        (tx, code) => {
                            this.responseCount++;
                            clearTimeout(handle);
                            eh.unregisterTxEvent(this.txId);
                            if (code !== 'VALID') {
                                const rejectMsg = `Peer ${eh.getPeerAddr()} has rejected transaction '${this.txId}' with code ${code}`;
                                LOG.error(rejectMsg);
                                reject(new Error(rejectMsg));
                            } else {
                                resolve();
                            }
                        },
                        (err) => {
                            LOG.warn(method, `event hub ${eh.getPeerAddr()} has disconnected with error ${err.message}`);
                            clearTimeout(handle);
                            eh.unregisterTxEvent(this.txId);

                            // We resolve rather than reject as we can still wait for other peers.
                            resolve();
                        }
                    );
                });
                this.listenerPromises.push(txPromise);
                this.timeoutHandles.push(handle);
            }
        });
        if (this.listenerPromises.length < this.requiredEventHubs) {
            this.cancelListening();
            const msg = 'No connected event hubs. It is required that at least 1 event hub has been connected to receive the commit event';
            LOG.error(method, msg);
            throw Error(msg);
        }
        LOG.exit(method);
    }

    /**
     * wait for all event hubs to send the tx event.
     */
    async waitForEvents() {
        const method = 'waitForEvents';
        LOG.entry(method);
        // don't need to check against requiredEventHubs as startListening has already checked
        // this listenerPromises.length. This ensures the same composer behaviour if requiredEventHubs
        // is set to 0.
        if (this.listenerPromises.length > 0) {
            await Promise.all(this.listenerPromises);
            if (this.responseCount < this.requiredEventHubs) {
                const msg = 'No event hubs responded. It is required that at least 1 event hub responds with a commit event';
                LOG.error(method, msg);
                throw Error(msg);
            }
        } else {
            LOG.warn(method, `No event hubs available to listen on to wait for a commit for transaction '${this.txId}'`);
        }
        LOG.exit(method);
    }

    /**
     * cancel listening for events
     */
    cancelListening() {
        const method = 'cancelListening';
        LOG.entry(method);
        this.timeoutHandles.forEach((handle) => {
            clearTimeout(handle);
        });
        this.eventHubs.forEach((eh) => {
            eh.unregisterTxEvent(this.txId);
        });
        LOG.exit(method);
    }
}

module.exports = HLFTxEventHandler;
