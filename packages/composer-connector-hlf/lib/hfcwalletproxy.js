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

const LOG = Logger.getLog('HFCWalletProxy');

/**
 * A class that implements a proxy between the Hyperledger Fabric,
 * key/value store, using the hfc module, and the Composer wallet.
 */
class HFCWalletProxy {

    /**
     * Constructor.
     * @param {Wallet} wallet The wallet to use.
     */
    constructor(wallet) {
        const method = 'constructor';
        LOG.entry(method, wallet);
        this.wallet = wallet;
        LOG.exit(method);
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
     * @param {string} name The name.
     * @param {function} cb The callback.
     * @return {Promise} A promise that is
     * resolved when complete.
     */
    getValue(name, cb) {
        const method = 'getValue';
        LOG.entry(method, name, cb);
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
                LOG.exit(method, value);
                return cb(null, value);
            })
            .catch((error) => {
                LOG.debug(method, error);
                return cb(error);
            });
    }

    /**
     * Set the value associated with name.
     * @param {string} name The name.
     * @param {string} value The value.
     * @param {function} cb The callback.
     * @return {Promise} A promise that is
     * resolved when complete.
     */
    setValue(name, value, cb) {
        const method = 'setValue';
        LOG.entry(method, name, value, cb);
        name = this.extractEnrollmentID(name);
        return this.wallet.contains(name)
            .then((contains) => {
                if (contains) {
                    return this.wallet.update(name, value);
                } else {
                    return this.wallet.add(name, value);
                }
            })
            .then(() => {
                LOG.exit(method);
                return cb(null);
            })
            .catch((error) => {
                LOG.error(method, error);
                return cb(error);
            });
    }

}

module.exports = HFCWalletProxy;
