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

let theWallet = null;

/**
 * Base class representing a wallet (a container of credentials).
 * @protected
 * @class
 * @abstract
 */
class Wallet {

    /**
     * Get the wallet singleton.
     * @return {Wallet} The wallet singleton, or null if one
     * has not been specified.
     */
    static getWallet() {
        return theWallet;
    }

    /**
     * Set the wallet singleton.
     * @param {Wallet} wallet The new wallet singleton.
     */
    static setWallet(wallet) {
        theWallet = wallet;
    }
    /**
     * List all of the credentials in the wallet.
     * @abstract
     * @return {Promise} A promise that is resolved with
     * an array of credential names, or rejected with an
     * error.
     */
    async listNames() {
        throw new Error('abstract function called');
    }

    /**
     * Check to see if the named credentials are in
     * the wallet.
     * @abstract
     * @param {string} name The name of the credentials.
     * @return {Promise} A promise that is resolved with
     * a boolean; true if the named credentials are in the
     * wallet, false otherwise.
     */
    async contains(name) {
        throw new Error('abstract function called');
    }

    /**
     * Get the named credentials from the wallet.
     * @abstract
     * @param {string} name The name of the credentials.
     * @return {Promise} A promise that is resolved with
     * the named credentials, or rejected with an error.
     */
    async get(name) {
        throw new Error('abstract function called');
    }

    /**
     * Add a new credential to the wallet.
     * @abstract
     * @param {string} name The name of the credentials.
     * @param {string} value The credentials.
     * @param {Object} [meta] Optional object with meta data
     * @return {Promise} A promise that is resolved when
     * complete, or rejected with an error.
     */
    async put(name, value, meta = {}) {
        throw new Error('abstract function called');
    }

    /**
     * Remove existing credentials from the wallet.
     * @abstract
     * @param {string} name The name of the credentials.
     * @return {Promise} A promise that is resolved when
     * complete, or rejected with an error.
     */
    async remove(name) {
        throw new Error('abstract function called');
    }

}

module.exports = Wallet;
