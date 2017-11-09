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

/**
 * Manages persistence of business network cards.
 *
 * @abstract
 * @class
 * @memberof module:composer-common
 */
class BusinessNetworkCardStore {
    /**
     * Get a default name for a given business network card.
     * @param {IdCard} card A business network card
     * @returns {String} A card name
     */
    static getDefaultCardName(card) {
        const locationName = card.getBusinessNetworkName() || card.getConnectionProfile().name;
        return card.getUserName() + '@' + locationName;
    }

    /**
     * Gets a card from the store.
     * @abstract
     * @param {String} cardName The name of the card to get
     * @return {Promise} A promise that is resolved with an IdCard.
     */
    get(cardName) {
        return Promise.reject(new Error('Abstract function called'));
    }

    /**
     * Puts a card in the store. It is an error to put a card name that already exists
     * in the store.
     * @abstract
     * @param {String} cardName The name of the card to save
     * @param {IdCard} card The card
     * @return {Promise} A promise that resolves once the data is written
     */
    put(cardName, card) {
        return Promise.reject(new Error('Abstract function called'));
    }

    /**
     * Gets all cards from the store.
     * @abstract
     * @return {Promise} A promise that is resolved with a Map where
     * the keys are identity card names and the values are IdCard objects.
     */
    getAll() {
        return Promise.reject(new Error('Abstract function called'));
    }

    /**
     * Delete a specific card from the store.
     * @abstract
     * @param {String} cardName The name of the card to delete
     * @return {Promise} A promise that resolves when the card is deleted.
     */
    delete(cardName) {
        return Promise.reject(new Error('Abstract function called'));
    }

}

module.exports = BusinessNetworkCardStore;
