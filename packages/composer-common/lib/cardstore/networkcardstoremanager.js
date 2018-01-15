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

const fs = require('fs');
const FileSystemCardStore = require('./filesystemcardstore');
process.env.SUPPRESS_NO_CONFIG_WARNING = 'y';
const config = require('config');


let allCardstores = {};

/**
 *
 */
class NetworkCardStoreManager {

    // will need init method to determine what the card store needs to be

    /** Get the card store by name
     * @param {String} name indexed name of the card store
     */
    static getCardStore(name = 'default', options = {}) {
        let cardstore = allCardstores[name];
        if (!cardstore) {
            // create the default card store here
            cardstore = NetworkCardStoreManager.createDefault(options);
        }
        return cardstore;
    }

    /**
     * Create the default based on the configuration options
     * Defaulting to the file system store if needed
     */
    static createDefault(options = {}) {
        let defaults = {
            'CardStore': {
                'type': 'FileSystemCardStore',
                'options': ''
            }
        };

        config.util.setModuleDefaults(defaults);
        let cardStoreData = config.get('Composer.CardStore');
        let cardStore = require(cardStore.type)(cardStoreData.get('options'));
        // need to create an instance of the type
        return cardStore;
    }

}

module.exports = NetworkCardStoreManager;