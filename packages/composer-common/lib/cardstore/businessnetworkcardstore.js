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
 * Applications would not work with this abstract class directly
 * The File system card store is the default for both Admin and Business Network Connections
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
     * @return {Promise} A promise that is resolved with an IdCard, or rejected if the card does not exist.
     */
    get(cardName) {
        return Promise.reject(new Error('BusinessNeworkCardStore Abstract function called - get'));
    }

    /**
     * Puts a card in the store. If the named card already exists in the store, it will be replaced.
     * @abstract
     * @param {String} cardName The name of the card to save
     * @param {IdCard} card The card
     * @return {Promise} A promise that resolves once the data is written
     */
    put(cardName, card) {
        return Promise.reject(new Error('BusinessNeworkCardStore Abstract function called - put'));
    }

    /**
     * Has returns a boolean indicating whether a card with the specified name exists or not.
     * @abstract
     * @param {String} cardName The name of the card to check
     * @return {Promise} A promise resolved with true or false.
     */
    has(cardName){
        return Promise.reject(new Error('BusinessNeworkCardStore Abstract function called - has'));
    }

    /**
     * Gets all cards from the store.
     * @abstract
     * @return {Promise} A promise that is resolved with a Map where
     * the keys are identity card names and the values are IdCard objects.
     */
    getAll() {
        return Promise.reject(new Error('BusinessNeworkCardStore Abstract function called - getAll'));
    }

    /**
     * Delete a specific card from the store.
     * @abstract
     * @param {String} cardName The name of the card to delete.
     * @return {Promise} A promise that resolves to true if the card existed; otherwise false.
     */
    delete(cardName) {
        return Promise.reject(new Error('BusinessNeworkCardStore Abstract function called - delete'));
    }

     /**
     * Get's a wallet back using the same backing store
     * @abstract
     * @private
     * @return {Promise} A promise that resolves to the wallet
     */
    getWallet(){
        return Promise.reject(new Error('BusinessNeworkCardStore Abstract function called - getWallet'));
    }

}

module.exports = BusinessNetworkCardStore;
