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
     */
    constructor(eventHubs, txId, timeout) {
        const method = 'constructor';
        LOG.entry(method, eventHubs, txId, timeout);
        this.eventHubs = eventHubs || [];
        this.txId = txId || '';
        this.listenerPromises = [];
        this.timeoutHandles = [];
        this.timeout = timeout || 0;
        LOG.exit(method);
    }

    /**
     * Start listening for events.
     */
    startListening() {
        const method = 'startListening';
        LOG.entry(method);

        this.eventHubs.forEach((eh) => {
            if (eh.isconnected()) {

                let handle;
                let txPromise = new Promise((resolve, reject) => {
                    handle = setTimeout(() => {
                        eh.unregisterTxEvent(this.txId);

                        // We reject to let the application know that the commit did not complete within the timeout
                        reject(new Error(`Failed to receive commit notification from ${eh.getPeerAddr()} for transaction '${this.txId}' within the timeout period`));
                    }, this.timeout);

                    eh.registerTxEvent(this.txId,
                        (tx, code) => {
                            clearTimeout(handle);
                            eh.unregisterTxEvent(this.txId);
                            if (code !== 'VALID') {
                                reject(new Error(`Peer ${eh.getPeerAddr()} has rejected transaction '${this.txId}' with code ${code}`));
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
        LOG.exit(method);
    }

    /**
     * wait for all event hubs to send the tx event.
     * @returns {Promise} a promise which is resolved when all the events have been received, rejected if an error occurs.
     */
    waitForEvents() {
        const method = 'waitForEvents';
        LOG.entry(method);
        if (this.listenerPromises.length > 0) {
            LOG.exit(method);
            return Promise.all(this.listenerPromises);
        }
        LOG.warn(method, 'No event hubs available to listen on to wait for transaction commits');
        LOG.exit(method);
        return Promise.resolve();
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
