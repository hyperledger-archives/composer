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
const path = require('path');

const Logger = require('../log/logger');
const LOG = Logger.getLog('ProxyCardStore');
const cloneDeep = require('lodash.clonedeep');
/**
 * Manages persistence of business network cards to the IBM Cloud Object Store
 * @private
 * @extends BusinessNetworkCardStore
 * @class
 * @memberof module:composer-common
 */
class WalletBackedCardStore extends BusinessNetworkCardStore {

    /**
     * Constructor.
     * @private
     * @param {Object} options Additional configuration options for the card store.
     */
    constructor(options) {
        super();
        if (!options) {
            throw new Error('Options must be given');
        }
        this.storeOptions = cloneDeep(options);
        this.storeOptions.namePrefix='cards';
        this.store = options.StoreModule.getStore(this.storeOptions);
    }

    /**
     * @private
     * @param {String} name the name to return
     * @return {Wallet} Returns the wallet
    */
    async getWallet(name){
        name = name || 'wallet';
        let walletOptions = cloneDeep(this.storeOptions);
        walletOptions.namePrefix=path.join('client-data',name);
        let wallet = await walletOptions.StoreModule.getStore(walletOptions);
        return wallet;
    }

    /**
     * @inheritdoc
     */
    get(cardName) {
        const method = 'get';
        LOG.entry(method);
        return this.store.get(cardName)
        .then((returnValue)=>{
            return IdCard.fromArchive(returnValue);
        })
        .catch((err)=>{
            LOG.error(method, err);
            const error = new Error('Card not found: ' + cardName);
            error.cause = err;
            throw error;
        });
    }

    /**
     * @inheritdoc
     */
    put(cardName, card) {
        const method = 'put';
        LOG.entry(method);

        if (!cardName) {
            return Promise.reject(new Error('Invalid card name'));
        }
        if (!card){
            return Promise.reject(new Error('no card to store'));
        }
        return card.toArchive({ type: 'nodebuffer' })
            .then((buffer)=>{
                return this.store.put(cardName,buffer,card);
            })
            .catch((err)=>{

                LOG.error(method, err);
                const error = new Error('Failed to save card: ' + cardName,err);
                error.cause = err;
                throw error;
            });
    }

    /**
     * @inheritdoc
     */
    has(cardName){
        return this.store.contains(cardName);
    }

    /**
     * @inheritdoc
     */
    getAll() {
        const method = 'getAll';
        LOG.entry(method);
        let results = new Map();


        let promises = [];
        return this.store.getAll()
        .then((allCards)=>{
            for (const entry of allCards){
                let key = entry[0];
                promises.push( IdCard.fromArchive(entry[1])
                    .then((value)=>{
                        results.set(key,value);
                    })
                 );
            }
            return Promise.all(promises);

        }).then(()=>{
            return results;
        });

    }

    /**
     * @inheritdoc
     */
    delete(cardName) {
        return this.store.remove(cardName);
    }

}

module.exports = WalletBackedCardStore;
