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

const BusinessNetworkCardStore = require('./businessnetworkcardstore');
const IdCard = require('../idcard');

/**
 * Transient in-memory storage of business network cards, useful for testing.
 *
 * @class
 * @private
 * @memberof module:composer-common
 */
class MemoryCardStore extends BusinessNetworkCardStore {
    /**
     * Constructor.
     */
    constructor() {
        super();
        this.cards = new Map();
    }

    /**
     * @inheritdoc
     */
    get(cardName) {
        const result = this.cards.get(cardName);
        return Promise.resolve(result);
    }

    /**
     * @inheritdoc
     */
    put(cardName, card) {
        if (!(card instanceof IdCard)) {
            return Promise.reject(new Error('Invalid card'));
        }
        this.cards.set(cardName, card);
        return Promise.resolve();
    }

    /**
     * @inheritdoc
     */
    getAll() {
        return Promise.resolve(this.cards);
    }

    /**
     * @inheritdoc
     */
    delete(cardName) {
        const cardExisted = this.cards.delete(cardName);
        return Promise.resolve(cardExisted);
    }

}

module.exports = MemoryCardStore;