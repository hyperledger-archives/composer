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

const Wallet = require('composer-common').Wallet;
const nodefs = require('fs');
const path = require('path');
const composerUtil = require('composer-common').Util;
const mkdirp = require('mkdirp');
const IdCard = require('composer-common').IdCard;
const rimraf = require('rimraf');
/**
 * String based key-val store,  A 'client-data' directory is created under the storePath option (or ~/.composer)
 * @private
*/
class FileSystemWallet extends Wallet{

    /**
     * Get the file system path for a given name.
     * @private
     * @param {String} name key value
     * @return {String} path to file where this value is stored is stored.
     */
    _path(name) {
        if (name.startsWith(this.storePath)){
            return name;
        }else {
            return path.join(this.storePath,name);
        }
    }

    /**
     * Is the name that is given represented by a directory?
     * @param {String} name name to check
     * @return {boolean} true if directory, false otherwise
     */
    _isDirectory(name){

        return new Promise((resolve,reject)=>{
            this.fs.stat(this._path(name),(err,status)=>{
                if (err){
                    resolve(false);
                }else {
                    resolve(status.isDirectory());
                }
            });
        });

    }

    /**
     * @param {Object} options  Configuration options
     * @param {Object} options.storePath  The root directory where this wallet can put things
     *                                    this is over and above the prefix... in effect the root.
     *                                    default is the ~/.composer
     */
    constructor(options){
        super();

        let root = options.storePath || path.resolve(composerUtil.homeDirectory(),'.composer');
        let prefix = options.namePrefix || '';
        this.storePath = path.join(root,prefix);

        this.fs = options.fs || nodefs;
        mkdirp.sync(this.storePath,{fs:this.fs});

        this.rimrafOptions = Object.assign({}, this.fs);
        this.rimrafOptions.disableGlob = true;
    }

    /**
     * List all of the credentials in the wallet.
     *
     * @return {Promise} A promise that is resolved with
     * an array of credential names, or rejected with an
     * error.
     */
    listNames() {

        return new Promise((resolve,reject)=>{
            try {
                resolve(this.fs.readdirSync(this.storePath));
            } catch (err){
                reject(err);
            }
        });

    }

    /**
     * Check to see if the named keys is in the wallet.
     *
     * @abstract
     * @param {string} name The name of the credentials.
     * @return {Promise} A promise that is resolved with
     * a boolean; true if the named key is in the
     * wallet, false otherwise.
     */
    contains(name) {
        if (!name) {
            return Promise.reject(new Error('Name must be specified'));
        }

        return new Promise((resolve,reject)=>{
            this.fs.stat(this._path(name),(err)=>{
                if (err){
                    resolve(false);
                }else {
                    resolve(true);
                }
            });
        });

    }

    /**
     * Get the named credentials from the wallet.
     * @abstractreadFile
     * @param {string} name The name of the credentials.
     * @return {Promise} A promise that is resolved with
     * the named credentials, or rejected with an error.
     */
    async get(name) {
        if (!name) {
            return Promise.reject(new Error('Name must be specified'));
        }

        let dir = await this._isDirectory(this._path(name));
        if(dir){
            let card = await IdCard.fromDirectory(this._path(name), this.fs);
            return card.toArchive({ type: 'nodebuffer' });
        } else {
            let result = this.fs.readFileSync(this._path(name),'utf8');
            if (result.startsWith('BASE64')){
                return Buffer.from(result.replace('BASE64::',''),'base64');
            }
            return result;
        }

    }

    /**
     * Add a new credential to the wallet.
     * @abstract
     * @param {string} name The name of the credentials.
     * @param {string} value The credentials.
     * @return {Promise} A promise that is resolved when
     * complete, or rejected with an error.
     */
    put(name, value) {
        if (!name) {
            return Promise.reject(new Error('Name must be specified'));
        }

        if (arguments[2]){
            let card = arguments[2];
            return card.toDirectory(this._path(name));

        } else if (value instanceof Buffer){
            return new Promise((resolve,reject)=>{
                this.fs.writeFile(this._path(name),'BASE64::'+value.toString('base64'),(err)=>{
                    if (err){
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });

        } else if (value instanceof String  || typeof value === 'string'){
            return new Promise((resolve,reject)=>{
                this.fs.writeFile(this._path(name),value,(err)=>{
                    if (err){
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
        } else {
            return Promise.reject(new Error('Unkown type being stored'));
        }
    }

    /**
     * Remove existing credentials from the wallet.
     * @abstract
     * @param {string} name The name of the credentials.
     * @return {Promise} A promise that is resolved when
     * complete, or rejected with an error.
     */
    async remove(name) {
        if (!name) {
            return Promise.reject(new Error('Name must be specified'));
        }

        let result = await this.contains(name);
        if (result){
            let dir = await this._isDirectory(name);

            if(dir){
                rimraf.sync(this._path(name),this.rimrafOptions);
            }else {
                this.fs.unlinkSync(this._path(name));
            }
            return true;

        } else {
            return false;
        }
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
                .then((value)  => {results.set(name,value);} );

                promises.push(p);
            }
            return Promise.all(promises);
        })
        .then(()=>{
            return results;
        });
    }

}

module.exports = FileSystemWallet;