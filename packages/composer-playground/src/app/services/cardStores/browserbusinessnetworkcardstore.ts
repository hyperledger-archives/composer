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
import { BusinessNetworkCardStore, IdCard } from 'composer-common';

/**
 * The playground business network store provides a combined view over
 * a business network store persisted in the web browser
 */
export class BrowserBusinessNetworkCardStore extends BusinessNetworkCardStore {

    private webStorage: Storage;
    private prefix = 'business-network-card';

    constructor() {
        super();

        this.webStorage = window.localStorage;
    }

    /**
     * Gets a card from the store.
     * @abstract
     * @param {String} cardName The name of the card to get
     * @return {Promise} A promise that is resolved with a {@link IdCard}.
     */
    get(cardName): Promise<IdCard> {
        let item = this.webStorage ? this.webStorage.getItem(this.prefix + cardName) : null;
        if (!item || item === 'null') {
            return Promise.reject('does not exist ' + cardName);
        }

        let cardProperties = JSON.parse(item);

        let cardObject = new IdCard(cardProperties.metadata, cardProperties.connectionProfile);
        cardObject.setCredentials(cardProperties.credentials);

        return Promise.resolve(cardObject);
    }

    /**
     * Puts a card in the store. It is an error to put a card name that already exists
     * in the store.
     * @param {String} cardName The name of the card to save
     * @param {IdCard} card The card
     * @return {Promise} A promise that resolves once the data is written
     */
    put(cardName, card): Promise<void> {
        return Promise.resolve(this.webStorage.setItem(this.prefix + cardName, JSON.stringify(card)));
    }

    /**
     * Has returns a boolean indicating whether a card with the specified name exists or not.
     * @abstract
     * @param {String} cardName The name of the card to check
     * @return {Promise} A promise resolved with true or false.
     */
    has(cardName) {
        return this.get(cardName).then(() => {
            return true;
        }).catch(() => {
            return false;
        });
    }

    /**
     * Gets all cards from the store.
     * @return {Promise} A promise that is resolved with a {@link Map} where
     * the keys are identity card names and the values are {@link IdCard} objects.
     */
    getAll(): Promise<Map<string, IdCard>> {
        let prefixLength = this.prefix.length;
        let businessNetworkCards: Map<string, IdCard> = new Map<string, IdCard>();

        let keys = Object.keys(this.webStorage);

        return keys.reduce((promise, key) => {
            return promise.then(() => {
                if (key.substr(0, prefixLength) === this.prefix) {
                    let name = key.substr(prefixLength);
                    return this.get(name)
                        .then((card: any) => {
                            return businessNetworkCards.set(name, card);
                        });
                }
            });
        }, Promise.resolve(new Map<string, IdCard>())).then(() => {
            return businessNetworkCards;
        });
    }

    /**
     * Delete a specific card from the store.
     * @param {String} cardName The name of the card to delete
     * @return {Promise} A promise that resolves when the card is deleted.
     */
    delete(cardName) {
        return Promise.resolve(this.webStorage.removeItem(this.prefix + cardName));
    }

    /** Implement the getWallet method - this is not needed within playground so return dummy object
     * The connector server will handle getting the wallet
     *
     * @return {Promise} Resolved with a dummy object
     */
    getWallet(): Promise<any> {
        return Promise.resolve({empty: 'browser-wallet'});
    }
}
