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
const Logger = require('./log/logger');
const mkdirp = require('mkdirp');
const path = require('path');
const thenify = require('thenify');
const thenifyAll = require('thenify-all');
const composerUtil = require('./util');
const Wallet = require('./wallet');

const LOG = Logger.getLog('FileWallet');

/**
 * Class implementing a wallet (a container of credentials) that
 * stores the credentials on the file system.
 *
 * @private
 * @class
 */
class FileWallet extends Wallet {

    /**
     * Get the current home directory.
     * @return {string} The current home directory.
     */
    static getHomeDirectory() {
        return composerUtil.homeDirectory();
    }

    /**
     * Constructor.
     * @param {Object} [options] The options to use.
     * @param {string} [options.directory] The directory to store
     * credentials in.
     * @param {Object} [fs] The file system implementation to use.
     */
    constructor(options) {
        super();
        const method = 'constructor';
        LOG.entry(method, options);

        // Generate the directory if not specified in the options.
        options = options || {};
        this.directory = options.directory;
        if (!this.directory) {
            this.directory = path.resolve(FileWallet.getHomeDirectory(), '.composer-credentials');
            LOG.debug(method, 'Generated directory', this.directory);
        }

        // Use the default fs implementation if one is not specified.
        let theFS = options.fs;
        if (!theFS) {
            theFS = fs;
        }

        // Promisify all of the APIs that we want to use.
        this.fs = thenifyAll(theFS, {});
        this.mkdirp = thenify((dir, cb) => {
            return mkdirp(dir, { fs: theFS }, cb);
        });

        LOG.exit(method);
    }

    /**
     * List all of the credentials in the wallet.
     * @return {Promise} A promise that is resolved with
     * an array of credential names, or rejected with an
     * error.
     */
    list() {
        const method = 'list';
        LOG.entry(method);
        const result = [];
        return this.fs.readdir(this.directory)
            .then((files) => {
                files.forEach((file) => {
                    LOG.debug(method, 'Found file', file);
                    result.push(file);
                });
                result.sort();
            })
            .catch((error) => {
                // Ignore any errors.
                LOG.debug(method, 'Ignoring error', error);
            })
            .then(() => {
                LOG.exit(method, result);
                return result;
            });
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
        const method = 'contains';
        LOG.entry(method, name);
        let result = false;
        const file = path.resolve(this.directory, name);
        return this.fs.readFile(file, 'utf8')
            .then((value) => {
                LOG.debug(method, 'Read file successfully');
                result = true;
            })
            .catch((error) => {
                // Ignore any errors.
                LOG.debug(method, 'Ignoring error', error);
            })
            .then(() => {
                LOG.exit(method, result);
                return result;
            });
    }

    /**
     * Get the named credentials from the wallet.
     * @abstract
     * @param {string} name The name of the credentials.
     * @return {Promise} A promise that is resolved with
     * the named credentials, or rejected with an error.
     */
    get(name) {
        const method = 'get';
        LOG.entry(method, name);
        const file = path.resolve(this.directory, name);
        return this.fs.readFile(file, 'utf8')
            .then((value) => {
                LOG.debug(method, 'Read file successfully');
                LOG.exit(method, value);
                return value;
            })
            .catch((error) => {
                LOG.error(method, error);
                throw error;
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
    add(name, value) {
        const method = 'add';
        LOG.entry(method, name, value);
        const file = path.resolve(this.directory, name);
        return this.mkdirp(this.directory)
            .then(() => {
                return this.fs.writeFile(file, value, { flag: 'wx', mode: 0o600 });
            })
            .then((value) => {
                LOG.debug(method, 'Wrote file successfully');
                LOG.exit(method);
            })
            .catch((error) => {
                LOG.error(method, error);
                throw error;
            });
    }

    /**
     * Update existing credentials in the wallet.
     * @abstract
     * @param {string} name The name of the credentials.
     * @param {string} value The credentials.
     * @return {Promise} A promise that is resolved when
     * complete, or rejected with an error.
     */
    update(name, value) {
        const method = 'update';
        LOG.entry(method, name, value);
        const file = path.resolve(this.directory, name);
        return this.fs.readFile(file, 'utf8')
            .then(() => {
                LOG.debug(method, 'Read file successfully');
                return this.fs.writeFile(file, value, { mode: 0o600 });
            })
            .then((value) => {
                LOG.debug(method, 'Wrote file successfully');
                LOG.exit(method);
            })
            .catch((error) => {
                LOG.error(method, error);
                throw error;
            });
    }

    /**
     * Remove existing credentials from the wallet.
     * @abstract
     * @param {string} name The name of the credentials.
     * @return {Promise} A promise that is resolved when
     * complete, or rejected with an error.
     */
    remove(name) {
        const method = 'remove';
        LOG.entry(method, name);
        const file = path.resolve(this.directory, name);
        return this.fs.unlink(file)
            .then((value) => {
                LOG.debug(method, 'Removed file successfully');
                LOG.exit(method);
            })
            .catch((error) => {
                LOG.error(method, error);
                throw error;
            });
    }

}

module.exports = FileWallet;
