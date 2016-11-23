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
const PROFILE_ROOT = homedir() + '/concerto-connection-profiles/';
const CONNECTION_FILE = 'connection.json';
const ENCODING = 'utf8';

const mkdirp = require('mkdirp');

/**
 * Stores connection profiles on an attached fs filesystem.
 * The connection profiles are loaded from the ''<HOME_DIR>/concerto-connection-profiles/'
 * directory.
 *
 * @private
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

        this.fileSystem = fs;
    }

    /**
     * Loads connectOptions for a given connection profile.
     *
     * @param {string} connectionProfile The name of the connection profile to load
     * @return {Promise} A promise that is resolved with a JS Object for the
     * data in the connection profile.
     */
    load(connectionProfile) {
        const self = this;
        return new Promise((resolve, reject) => {
            const options = { flag : 'r', encoding : ENCODING };
            self.fileSystem.readFile(PROFILE_ROOT + connectionProfile + '/' + CONNECTION_FILE, options,
                (err, contents) => {
                    if (!err) {
                        resolve(JSON.parse(contents));
                    } else {
                        reject(new Error('Failed to load connection profile ' + connectionProfile));
                    }
                });
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

        const DIR = PROFILE_ROOT + connectionProfile + '/';
        const self = this;

        return new Promise(
                (resolve, reject) => {
                    mkdirp(DIR, {
                        fs: self.fileSystem
                    },
                        (err, contents) => {
                            if (!err) {
                                resolve();
                            } else {
                                reject(err);
                            }
                        });
                })
            .then(() => {
                return new Promise(
                    (resolve, reject) => {
                        const options = { flag : 'w', encoding : ENCODING };
                        self.fileSystem.writeFile(DIR + CONNECTION_FILE, JSON.stringify(connectOptions), options,
                            (err, contents) => {
                                if (!err) {
                                    resolve();
                                } else {
                                    reject(new Error('Failed to save connection profile ' + connectionProfile));
                                }
                            });
                    });
            });
    }
}

module.exports = FSConnectionProfileStore;
