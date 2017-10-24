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

const path = require('path');
const FileSystemCardStore = require('composer-common').FileSystemCardStore;

/**
 * Provide locations to use for HLF client data and crypto stores.
 *
 * @private
 * @class
 * @memberof module:composer-client
 */
class HLFStoreLocator {
    /**
     * Constructor.
     * @param {FileSystemCardStore} [cardStore] Card store currently in use.
     */
    constructor(cardStore) {
        this.cardStore = (cardStore instanceof FileSystemCardStore) ? cardStore : new FileSystemCardStore();
    }

    /**
     * Get the location in which to store HLF client data for a given card.
     * @param {String} cardName Name of a card.
     * @returns {String} File system path.
     */
    clientDataStorePath(cardName) {
        return path.join(this.cardStore.cardPath(cardName), 'client-data-store');
    }

    /**
     * Update the supplied connection profile to include additional information required for a given card to be used
     * to connect to the Fabric instance it describes.
     * @param {Object} connectionProfile Connection profile data.
     * @param {String} cardName Name of the card.
     * @returns {Object} Connection profile data.
     */
    updateConnectionProfile(connectionProfile, cardName) {
        connectionProfile.keyValStore = this.clientDataStorePath(cardName);
        return connectionProfile;
    }
}

module.exports = HLFStoreLocator;
