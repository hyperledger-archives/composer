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

const api = require('fabric-client/lib/api');
const Logger = require('composer-common').Logger;
const KeyValueStore = api.KeyValueStore;

const LOG = Logger.getLog('HLFWalletProxy');

/**
 * A class that implements a proxy between the Hyperledger Fabric,
 * key/value store, using the hfc module, and the Composer wallet.
 */
class HLFWalletProxy extends KeyValueStore {

    /**
     * Constructor.
     * @param {Wallet} wallet The wallet to use.
     */
    constructor(wallet) {
        super();
        const method = 'constructor';
        LOG.entry(method, wallet);
        this.wallet = wallet;
        LOG.exit(method);
        return Promise.resolve(this);
    }

    /**
     * Extract the enrollment ID from a Hyperledger Fabric key/value
     * store name which is in the format member.<enrollmentID>.
     * @param {string} name key/value store name.
     * @return {string} the enrollment ID.
     */
    extractEnrollmentID(name) {
        return name.replace(/^member\./, '');
    }

    /**
     * Get the value associated with name.
     * @param {string} name of the key
     * @returns {Promise} Promise for the value corresponding to the key.
     * If the value does not exist in the store, returns null without
     * rejecting the promise
     */
    getValue(name) {
        const method = 'getValue';
        LOG.entry(method, name);
        name = this.extractEnrollmentID(name);
        return this.wallet.contains(name)
            .then((result) => {
                if (result) {
                    return this.wallet.get(name);
                } else {
                    return null;
                }
            })
            .then((value) => {
                // Can't log the value, it might be a private key
                LOG.exit(method);
                return value;
            })
            .catch((error) => {
                LOG.error(method, error);
                throw error;
            });
    }

    /**
     * Set the value associated with name.
     * @param {string} name of the key to save
     * @param {string} value to save
     * @returns {Promise} Promise for the 'value' object upon successful write operation
     */
    setValue(name, value) {
        const method = 'setValue';
        // can't log the value, it may be a private key
        LOG.entry(method, name);
        name = this.extractEnrollmentID(name);
        return this.wallet.put(name,value)
            .then(() => {
                LOG.exit(method);
            })
            .catch((error) => {
                LOG.error(method, error);
                throw error;
            });
    }

}

module.exports = HLFWalletProxy;
