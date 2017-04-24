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

const ConnectionProfileStore = require('./connectionprofilestore');

const homedir = require('homedir');
const mkdirp = require('mkdirp');
const path = require('path');
const rimraf = require('rimraf');
const thenify = require('thenify');
const thenifyAll = require('thenify-all');

const PROFILE_ROOT = (() => {
    const h = homedir();
    if (h) {
        return path.resolve(h, '.composer-connection-profiles');
    } else {
        return path.resolve('/', '.composer-connection-profiles');
    }
})();
const CONNECTION_FILE = 'connection.json';
const ENCODING = 'utf8';

const LOG = require('./log/logger').getLog('FSConnectionProfileStore');

/**
 * Stores connection profiles on an attached fs fs.
 * The connection profiles are loaded from the ''<HOME_DIR>/composer-connection-profiles/'
 * directory.
 *
 * @private
 * @extends ConnectionProfileStore
 * @see See [ConnectionProfileStore]{@link module:composer-common.ConnectionProfileStore}
 * @class
 * @memberof module:composer-common
 */
class FSConnectionProfileStore extends ConnectionProfileStore {

    /**
     * Create the ConnectionManager and attach a file system
     * @param {fs} fs - Node.js FS implementation, for example BrowserFS
     */
    constructor(fs) {
        super();
        if (!fs) {
            throw new Error('Must create FSConnectionProfileStore with an fs implementation.');
        }

        this.fs = thenifyAll(fs, {});
        this.mkdirp = thenify((dir, cb) => {
            return mkdirp(dir, { fs: fs }, cb);
        });
        this.rimraf = thenify((dir, cb) => {
            return rimraf(dir, fs, cb);
        });
    }

    /**
     * Loads connectOptions for a given connection profile.
     *
     * @param {string} connectionProfile The name of the connection profile to load
     * @return {Promise} A promise that is resolved with a JS Object for the
     * data in the connection profile.
     */
    load(connectionProfile) {
        const options = { flag : 'r', encoding : ENCODING };
        return this.fs.readFile(path.resolve(PROFILE_ROOT, connectionProfile, CONNECTION_FILE), options)
            .then((contents) => {
                LOG.info('load','Loaded connection profile ' + connectionProfile, contents);
                return JSON.parse(contents);
            })
            .catch((err) => {
                LOG.error('load','Failed to loaded connection profile ' + connectionProfile, err);
                throw new Error('Failed to load connection profile ' + connectionProfile + '. Error was ' + err);
            });
    }

    /**
     * Save connectOptions for a given connection profile.
     *
     * @param {string} connectionProfile The name of the connection profile to save
     * @param {Object} connectOptions The connection options object
     * @return {Promise} A promise that once the data is written
     */
    save(connectionProfile, connectOptions) {
        const DIR = path.resolve(PROFILE_ROOT, connectionProfile);
        return this.mkdirp(DIR)
            .then(() => {
                const options = { flag : 'w', encoding : ENCODING };
                return this.fs.writeFile(path.resolve(DIR, CONNECTION_FILE), JSON.stringify(connectOptions, null, 4), options);
            })
            .then(() => {
                LOG.info('save','Saved connection profile ' + connectionProfile);
            })
            .catch((err) => {
                LOG.error('save','Failed to save connection profile ' + connectionProfile, err);
                throw new Error('Failed to save connection profile ' + connectionProfile);
            });
    }

    /**
     * Loads all of the connection profiles.
     *
     * @return {Promise} A promise that is resolved with a JS Object where the
     * keys are the connection profiles, and the values are the connection options.
     */
    loadAll() {
        const result = {};
        return this.fs.readdir(PROFILE_ROOT)
            .then((files) => {
                return files.reduce((promise, file) => {
                    return promise.then(() => {
                        return this.load(file);
                    })
                    .then((profile) => {
                        result[file] = profile;
                    })
                    .catch((error) => {
                        // Ignore any errors.
                    });
                }, Promise.resolve());
            })
            .catch((error) => {
                // Ignore any errors.
            })
            .then(() => {
                return result;
            });
    }

    /**
     * Delete the given connection profile.
     *
     * @param {string} connectionProfile The name of the connection profile to delete
     * @return {Promise} A promise that is resolved when the connection profile
     * is deleted.
     */
    delete(connectionProfile) {
        const DIR = path.resolve(PROFILE_ROOT, connectionProfile);
        return this.rimraf(DIR);
    }

}

module.exports = FSConnectionProfileStore;
