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
     * @param {*} app The LoopBack application.
     * @param {*} wallet The wallet instance.
     */
    constructor(app, wallet) {
        super();
        this.app = app;
        this.wallet = wallet;
    }

    /**
     * List all of the credentials in the wallet.
     * @abstract
     * @return {Promise} A promise that is resolved with
     * an array of credential names, or rejected with an
     * error.
     */
    list() {
        return this.app.models.WalletIdentity.find({ where: { walletId: this.wallet.id } })
            .then((identities) => {
                return identities.map((identity) => {
                    return identity.enrollmentID;
                });
            });
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
    contains(name) {
        return this.app.models.WalletIdentity.count({ walletId: this.wallet.id, enrollmentID: name })
            .then((count) => {
                return count !== 0;
            });
    }

    /**
     * Get the named credentials from the wallet.
     * @abstract
     * @param {string} name The name of the credentials.
     * @return {Promise} A promise that is resolved with
     * the named credentials, or rejected with an error.
     */
    get(name) {
        return this.app.models.WalletIdentity.findOne({ where: { walletId: this.wallet.id, enrollmentID: name } })
            .then((identity) => {
                return identity.certificate;
            });
    }

    /**
     * Add a new credential to the wallet.
     * @abstract
     * @param {string} name The name of the credentials.
     * @param {string} value The credentials.
     * @return {Promise} A promise that is resolved when
     * complete, or rejected with an error.
     */
    add(name, value) {
        return this.app.models.WalletIdentity.findOne({ where: { walletId: this.wallet.id, enrollmentID: name } })
            .then((identity) => {
                return identity.updateAttribute('certificate', value);
            });
    }

    /**
     * Update existing credentials in the wallet.
     * @abstract
     * @param {string} name The name of the credentials.
     * @param {string} value The credentials.
     * @return {Promise} A promise that is resolved when
     * complete, or rejected with an error.
     */
    update(name, value) {
        return this.app.models.WalletIdentity.findOne({ where: { walletId: this.wallet.id, enrollmentID: name } })
            .then((identity) => {
                return identity.updateAttribute('certificate', value);
            });
    }

    /**
     * Remove existing credentials from the wallet.
     * @abstract
     * @param {string} name The name of the credentials.
     * @return {Promise} A promise that is resolved when
     * complete, or rejected with an error.
     */
    remove(name) {
        return this.app.models.WalletIdentity.destroyAll({ walletId: this.wallet.id, enrollmentID: name });
    }

}

module.exports = LoopBackWallet;
