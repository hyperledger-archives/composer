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
import { BrowserBusinessNetworkCardStore } from './browserbusinessnetworkcardstore';
/* tslint:disable:no-var-requires */
const ProxyBusinessNetworkCardStore = require('composer-connector-proxy').ProxyBusinessNetworkCardStore;

/**
 * The playground connection profile store provides a combined view over a connection
 * profile store persisted in the web browser (for web connection profiles) and a
 * connection profile store persisted in the connector server (for other connection
 * profile types).
 */
export class PlaygroundBusinessNetworkCardStore extends BusinessNetworkCardStore {

    browserBusinessNetworkCardStore: BusinessNetworkCardStore = null;
    proxyBusinessNetworkCardStore: BusinessNetworkCardStore = null;

    constructor() {
        super();
        // The proxy connection manager defaults to http://localhost:15699,
        // but that is not suitable for anything other than development.
        if (ENV && ENV !== 'development') {
            ProxyBusinessNetworkCardStore.setConnectorServerURL(window.location.origin);
        }
        this.browserBusinessNetworkCardStore = new BrowserBusinessNetworkCardStore();
        this.proxyBusinessNetworkCardStore = new ProxyBusinessNetworkCardStore();
    }

    /**
     * Gets a card from the store.
     * @abstract
     * @param {String} cardName The name of the card to get
     * @return {Promise} A promise that is resolved with a {@link IdCard}.
     */
    get(cardName): Promise<any> {
        // Try loading it from the browser first.
        return this.browserBusinessNetworkCardStore.get(cardName)
            .catch((error) => {
                // No - try loading it from the connector server instead.
                return this.proxyBusinessNetworkCardStore.get(cardName);
            });
    }

    /**
     * Puts a card in the store. It is an error to put a card name that already exists
     * in the store.
     * @param {String} cardName The name of the card to save
     * @param {IdCard} card The card
     * @return {Promise} A promise that resolves once the data is written
     */
    put(cardName, card): Promise<void> {
        if (card.connectionProfile['x-type'] === 'web') {
            // Web card - save to the browser.
            return this.browserBusinessNetworkCardStore.put(cardName, card);
        } else {
            // Any other card - save it to the connector server.
            return this.proxyBusinessNetworkCardStore.put(cardName, card);
        }
    }

    /**
     * Has returns a boolean indicating whether a card with the specified name exists or not.
     * @abstract
     * @param {String} cardName The name of the card to check
     * @return {Promise} A promise resolved with true or false.
     */
    has(cardName) {
        return this.browserBusinessNetworkCardStore.has(cardName)
            .then((hasCard) => {
                if (hasCard) {
                    return true;
                }
                // No - try loading it from the connector server instead.
                return this.proxyBusinessNetworkCardStore.has(cardName);
            });
    }

    /**
     * Gets all cards from the store.
     * @return {Promise} A promise that is resolved with a {@link Map} where
     * the keys are identity card names and the values are {@link IdCard} objects.
     */
    getAll(): Promise<Map<string, IdCard>> {
        let result: Map<string, IdCard> = new Map<string, IdCard>();
        // Load all of the browser cards.
        return this.browserBusinessNetworkCardStore.getAll()
            .then((cards) => {
                result = cards;
                // Load all of the connector server cards.
                return this.proxyBusinessNetworkCardStore.getAll();
            })
            .then((cards) => {
                cards.forEach((idCard, cardName) => {
                    result.set(cardName, idCard);
                });

                return result;
            });
    }

    /**
     * Delete a specific card from the store.
     * @param {String} cardName The name of the card to delete
     * @return {Promise} A promise that resolves when the card is deleted.
     */
    delete(cardName): Promise<void> {
        // Load the card first so we can figure out what type it is.
        return this.get(cardName)
            .catch(() => {
                // Ignore error and just fall through.
            })
            .then((card) => {
                if (!card) {
                    // Don't do anything - card doesn't exist.
                } else if (card.connectionProfile['x-type'] === 'web') {
                    // Web card - remove from the browser.
                    return this.browserBusinessNetworkCardStore.delete(cardName);
                } else {
                    // Any other card - remove from the connector server.
                    return this.proxyBusinessNetworkCardStore.delete(cardName);
                }
            });
    }

    /** Implement the getWallet method - this is not needed within playground so return dummy object
     * The connector server will handle getting the wallet
     *
     * @return {Promise} Resolved with a dummy object
     */
    getWallet(): Promise<any> {
        return Promise.resolve({empty: 'playground-wallet'});
    }
}
