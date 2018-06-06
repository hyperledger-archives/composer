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

const Wallet = require('composer-common').Wallet;

/**
 * An implementation of the {@link Wallet} class that persists the users
 * identities into a LoopBack managed data source.
 */
class LoopBackWallet extends Wallet {

    /**
     * Constructor.
     * @param {card} card The card instance.
     */
    constructor(card) {
        super();
        this.card = card;
    }

    /**
     * List all of the credentials in the wallet.
     * @return {Promise} A promise that is resolved with
     * an array of credential names, or rejected with an
     * error.
     */
    async listNames() {
        const card = await this.card.reload();
        return Object.keys(card.data).sort();
    }

    /**
     * Check to see if the named credentials are in
     * the wallet.
     * @param {string} name The name of the credentials.
     * @return {Promise} A promise that is resolved with
     * a boolean; true if the named credentials are in the
     * wallet, false otherwise.
     */
    async contains(name) {
        const card = await this.card.reload();
        return card.data.hasOwnProperty(name);
    }

    /**
     * Get the named credentials from the wallet.
     * @param {string} name The name of the credentials.
     * @return {Promise} A promise that is resolved with
     * the named credentials, or rejected with an error.
     */
    async get(name) {
        const card = await this.card.reload();
        return card.data[name];
    }

    /**
     * Add a new credential to the wallet.
     * @param {string} name The name of the credentials.
     * @param {string} value The credentials.
     * @param {Object} [meta] Optional object with meta data
     */
    async put(name, value, meta = {}) {
        const card = await this.card.reload();
        card.data[name] = value;
        await card.save();
    }

    /**
     * Remove existing credentials from the wallet.
     * @param {string} name The name of the credentials.
     */
    async remove(name) {
        const card = await this.card.reload();
        delete card.data[name];
        await card.save();
    }

}

module.exports = LoopBackWallet;
