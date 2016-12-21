/*
 * IBM Confidential
 * OCO Source Materials
 * IBM Concerto - Blockchain Solution Framework
 * Copyright IBM Corp. 2016
 * The source code for this program is not published or otherwise
 * divested of its trade secrets, irrespective of what has
 * been deposited with the U.S. Copyright Office.
 */

'use strict';

const ConnectionProfileStore = require('./connectionprofilestore');

const homedir = require('homedir');
const mkdirp = require('mkdirp');
const path = require('path');
const thenify = require('thenify');
const thenifyAll = require('thenify-all');

const PROFILE_ROOT = (() => {
    const h = homedir();
    if (h) {
        return path.resolve(h, '.concerto-connection-profiles');
    } else {
        return path.resolve('/', '.concerto-connection-profiles');
    }
})();
const CONNECTION_FILE = 'connection.json';
const ENCODING = 'utf8';

const LOG = require('./log/logger').getLog('FSConnectionProfileStore');

/**
 * Stores connection profiles on an attached fs fs.
 * The connection profiles are loaded from the ''<HOME_DIR>/concerto-connection-profiles/'
 * directory.
 *
 * @private
 * @extends ConnectionProfileStore
 * @see See [ConnectionProfileStore]{@link module:ibm-concerto-common.ConnectionProfileStore}
 * @class
 * @memberof module:ibm-concerto-common
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
                throw new Error('Failed to load connection profile ' + connectionProfile);
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
}

module.exports = FSConnectionProfileStore;
