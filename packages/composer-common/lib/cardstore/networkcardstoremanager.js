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

let cardStore;
const cfg = require('../config/configmediator.js');
const WalletBackedStore = require('./walletbackedcardstore');

const LoadModule = require('../module/loadModule');
const path=require('path');

const moduleCache = {};
/**
 * Provides the loading mechanism for handling card stores.
 * This uses system configuration to get the required type of the card store (a NPM module)
 *
 * The name of the module must start with 'composer-wallet' to help separate concerns and prevent just anything
 * from being used.
 *
 * Assumptions:
 *   That the supplied module is installed gloabally
 *
 *
 * @private
 */
class NetworkCardStoreManager {

    /**
     * @param {Object} options Any options to be passed to the card store
     * @return {BusinessNetworkCardStore} instance of a BusinessNetworkCardStore to use
     */
    static getCardStore(options = { 'type': 'composer-wallet-filesystem' }) {
        let cardStoreCfg = cfg.get('wallet',options );
        if (cardStoreCfg.type.match(/composer-wallet/)){
            // the relative path here is to ensure that in a flat structure eg dev build the module can be found
            let paths = [path.resolve(__dirname,'../../../')];
            if (options.paths){
                paths = paths.concat(options.paths);
            }
            let StoreModule = moduleCache[cardStoreCfg.type];
            if (!StoreModule){
                StoreModule = cardStoreCfg.walletmodule || LoadModule.loadModule(cardStoreCfg.type,{paths});
                moduleCache[cardStoreCfg.type] = StoreModule;
            }
            if (!StoreModule){
                throw new Error(`Unable to load requested module ${cardStoreCfg.type}`);
            }
            if (StoreModule.getStore){
                let opts = cardStoreCfg.options || options;
                opts.StoreModule = StoreModule;
                cardStore = new WalletBackedStore(opts);
            }else {
                throw new Error(`Module loaded does not have correct interface ${cardStoreCfg.type}`);
            }
        } else {
            throw new Error(`Module give does not have valid name ${cardStoreCfg.type}`);
        }

        return cardStore;

    }

}

module.exports = NetworkCardStoreManager;