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
const util = require('util');
const composerUtil = require('composer-common').Util;
const mkdirp = require('mkdirp');
const IdCard = require('composer-common').IdCard;
const rimraf = util.promisify(require('rimraf'));
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
        return this._stat(this._path(name))
        .then(status=>{
            return status.isDirectory();
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
        this.storePath = path.join(root,options.namePrefix);

        this.fs = options.fs || nodefs;
        mkdirp.sync(this.storePath,{fs:this.fs});

        this._readFile = util.promisify(this.fs.readFile);
        this._writeFile = util.promisify(this.fs.writeFile);
        this._stat = util.promisify(this.fs.stat);
        this._readdir = util.promisify(this.fs.readdir);
        this._unlink = util.promisify(this.fs.unlink);

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
        return this._readdir(this.storePath)
          .then((result)=>{

              return result;
          });

    }

    /**
     * Check to see if the named credentials are in
     * the wallet.
     * @abstract
     * @param {string} name The name of the credentials.
     * @return {Promise} A promise that is resolved with
     * a boolean; true if the named credentials are in the
     * wallet, false otherwise.
     */
    contains(name) {
        if (!name) {
            return Promise.reject(new Error('Name must be specified'));
        }
        return this._stat(this._path(name))
         .then(()=>{
             return true;
         })
         .catch((error)=>{
             return false;
         });

    }

    /**
     * Get the named credentials from the wallet.
     * @abstractreadFile
     * @param {string} name The name of the credentials.
     * @return {Promise} A promise that is resolved with
     * the named credentials, or rejected with an error.
     */
    get(name) {
        if (!name) {
            return Promise.reject(new Error('Name must be specified'));
        }
        return this._isDirectory(this._path(name))
        .then((dir)=>{
            if(dir){
                return IdCard.fromDirectory(this._path(name), this.fs)
                .then((card)=>{
                    return card.toArchive({ type: 'nodebuffer' });
                });
            } else {
                return this._readFile(this._path(name),'utf8')
                .then((result)=>{
                    if (result.startsWith('BASE64')){
                        return Buffer.from(result.replace('BASE64::',''),'base64');
                    }
                    return result;
                });
            }

        });
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
            // base 64 encode the buffer and write it as a string.
            return this._writeFile(this._path(name),'BASE64::'+value.toString('base64'));
        } else if (value instanceof String  || typeof value === 'string'){
            return this._writeFile(this._path(name),value);
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
    remove(name) {
        if (!name) {
            return Promise.reject(new Error('Name must be specified'));
        }
        return this.contains(name).then(
            (result)=>{
                if (result){
                    return this._isDirectory(name)
                    .then((dir)=>{
                        if(dir){
                            return rimraf(this._path(name),this.rimrafOptions);
                        }else {
                            return this._unlink(this._path(name));
                        }
                    }).then(()=>{return true;});
                } else {
                    return false;
                }
            }
        );


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