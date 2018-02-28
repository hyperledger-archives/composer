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
const IdCard = require('composer-common').IdCard;
const Wallet = require('composer-common').Wallet;

/**
 * String based key-val store,  A 'client-data' directory is created under the storePath option (or ~/.composer)
 * @private
*/
class MemoryWallet extends Wallet{

    /**
     * @param {Object} options  Configuration options
     * @param {Object} options.storePath  The root directory where this wallet can put thibngs
     */
    constructor(options){
        super();
        this.store = new Map();
        this.namePrefix = options.namePrefix;
    }
    /**
     * Get a "path name", this is not part of the interface but is used to create a suitable name
     * to achieve separation of entries
     *
     * @private
     * @param {String} name name to use as the key
     * @return {String} full 'path' name
     */
    _path(name) {
        if (name.startsWith(this.namePrefix)){
            return name;
        }else {
            return path.join(this.namePrefix,name);
        }
    }
    /**
     * List all of the credentials in the wallet.
     *
     * @return {Promise} A promise that is resolved with
     * an array of credential names, or rejected with an
     * error.
     */
    listNames() {
        let a = Array.from(this.store.keys());
        let list = a.map( (e) => {
            return e.replace(this.namePrefix+path.sep,'');
        } );
        return Promise.resolve(list);
    }

    /**
     * Check to see if the named credentials are in
     * the wallet.

     * @param {string} name The name of the credentials.
     * @return {Promise} A promise that is resolved with
     * a boolean; true if the named credentials are in the
     * wallet, false otherwise.
     */
    contains(name) {
        if (!name) {
            return Promise.reject(new Error('Name must be specified'));
        }
        return Promise.resolve(this.store.has( this._path(name)));
    }

    /**
     * Get the named credentials from the wallet.
     *
     * @param {string} name The name of the credentials.
     * @return {Promise} A promise that is resolved with
     * the named credentials, or rejected with an error.
     */
    get(name) {
        if (!name) {
            return Promise.reject(new Error('Name must be specified'));
        }
        let value = this.store.get( this._path(name));
        if (value){
            return Promise.resolve(value);
        } else {
            return Promise.reject('No such entry');
        }

    }

    /**
     * Add a new credential to the wallet.
     *
     * @param {string} name The name of the credentials.
     * @param {string} value The credentials.
     * @return {Promise} A promise that is resolved when
     * complete, or rejected with an error.
     */
    put(name, value) {

        if (!name) {
            return Promise.reject(new Error('Name must be specified'));
        }

        if (value instanceof IdCard || value instanceof Buffer || value instanceof String  || typeof value === 'string'){
            this.store.set( this._path(name),value);
            return Promise.resolve();
        }else {
            return Promise.reject(new Error('Unkown type being stored'));
        }


    }

    /**
     * Remove existing credentials from the wallet.
     *
     * @param {string} name The name of the credentials.
     * @return {Promise} A promise that is resolved when
     * complete, or rejected with an error.
     */
    remove(name) {
        if (!name) {
            return Promise.reject(new Error('Name must be specified'));
        }
        return Promise.resolve(this.store.delete( this._path(name)));
    }
    /**
     * Gets a map of all the key-value pairs
     * @return {Map} of all the key-value pairs
    */
    getAll(){
        let results = new Map();
        let promises= [];
        return this.listNames()
        .then((names) =>{
            for (const name of names) {

                let  p = this.get(name)
                .then((value)  => {
                    let mapKey = name.replace(this.namePrefix+path.sep,'');
                    results.set(mapKey,value);} );

                promises.push(p);
            }
            return Promise.all(promises);
        })
        .then(()=>{
            return results;
        });
    }
}

module.exports = MemoryWallet;