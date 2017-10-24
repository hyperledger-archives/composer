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

const nodeFs = require('fs');
const os = require('os');
const path = require('path');
const rimraf = require('rimraf');
const thenifyAll = require('thenify-all');
const IdCard = require('../idcard');
const BusinessNetworkCardStore = require('./businessnetworkcardstore');

const thenifyRimraf = thenifyAll(rimraf);

const Logger = require('../log/logger');
const LOG = Logger.getLog('FileSystemCardStore');

/**
 * Manages persistence of business network cards to a Node file system implementation.
 *
 * @private
 * @class
 * @memberof module:composer-common
 */
class FileSystemCardStore extends BusinessNetworkCardStore {
    /**
     * Constructor.
     * @param {Object} options Additional configuration options for the card store.
     * @param {*} [options.fs] Node file system implementation. Defaults to Node implementation.
     * @param {String} [options.storePath] Location of the card store. Default: $HOME/.composer/cards
     */
    constructor(options) {
        super();
        if (!options) {
            options = {};
        }
        this.fs = options.fs || nodeFs;
        this.thenifyFs = thenifyAll(this.fs);
        this.rimrafOptions = Object.assign({}, this.fs);
        this.rimrafOptions.disableGlob = true;
        this.storePath = options.storePath || FileSystemCardStore.defaultStorePath(os.homedir);
    }

    /**
     * Get the default store path based on the user's home directory, or based on the filesystem root
     * directory if the supplied function does not exist or returns a falsy value.
     * @param {Function} homedirFunction Function to obtain the user's home directory
     * @returns {String} Absolute path
     */
    static defaultStorePath(homedirFunction) {
        const homeDirectory = (homedirFunction && homedirFunction()) || path.sep;
        return path.join(homeDirectory, '.composer', 'cards');
    }

    /**
     * Get the file system path for a given card.
     * @param {String} cardName name of the card.
     * @return {String} directory in which the card is stored.
     */
    cardPath(cardName) {
        return path.join(this.storePath, cardName);
    }

    /**
     * Gets a card from the store.
     * @param {String} cardName The name of the card to get
     * @return {Promise} A promise that is resolved with a {@link IdCard}.
     */
    get(cardName) {
        const method = 'get';
        return IdCard.fromDirectory(this.cardPath(cardName), this.fs).catch(cause => {
            LOG.error(method, cause);
            const error = new Error('Card not found: ' + cardName);
            error.cause = cause;
            throw error;
        });
    }

    /**
     * Puts a card in the store.
     * @param {String} cardName The name of the card to save
     * @param {IdCard} card The card
     * @return {Promise} A promise that resolves once the data is written
     */
    put(cardName, card) {
        const method = 'put';

        if (!cardName) {
            return Promise.reject(new Error('Invalid card name'));
        }

        return card.toDirectory(this.cardPath(cardName), this.fs).catch(cause => {
            LOG.error(method, cause);
            const error = new Error('Failed to save card: ' + cardName);
            error.cause = cause;
            throw error;
        });
    }

    /**
     * Gets all cards from the store.
     * @return {Promise} A promise that is resolved with a {@link Map} where
     * the keys are identity card names and the values are {@link IdCard} objects.
     */
    getAll() {
        const method = 'getAll';

        const results = new Map();
        return this.thenifyFs.readdir(this.storePath).catch(cause => {
            // Store directory does not exist, so there are no cards
            LOG.debug(method, cause);
            return results;
        }).then(fileNames => {
            const getPromises = [];
            fileNames.forEach(cardName => {
                const promise = this.get(cardName).then(card => {
                    results.set(cardName, card);
                });
                getPromises.push(promise);
            });
            return Promise.all(getPromises);
        }).then(() => {
            return results;
        });
    }

    /**
     * Delete a specific card from the store.
     * @param {String} cardName The name of the card to delete
     * @return {Promise} A promise that resolves when the card is deleted.
     */
    delete(cardName) {
        const method = 'delete';

        const cardPath = this.cardPath(cardName);
        return this.thenifyFs.access(cardPath).then(() => {
            return thenifyRimraf(cardPath, this.rimrafOptions);
        }).catch(cause => {
            LOG.debug(method, cause);
            throw new Error('Card not found: ' + cardName);
        });
    }

}

module.exports = FileSystemCardStore;
