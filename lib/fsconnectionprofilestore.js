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

let LOG;
const ConnectionProfileStore = require('./connectionprofilestore');

const homedir = require('homedir');
const PROFILE_ROOT = homedir() + '/.concerto-connection-profiles/';
const CONNECTION_FILE = 'connection.json';
const ENCODING = 'utf8';

const mkdirp = require('mkdirp');

/**
 * Stores connection profiles on an attached fs filesystem.
 * The connection profiles are loaded from the ''<HOME_DIR>/concerto-connection-profiles/'
 * directory.
 *
 * @private
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
        if (!LOG) {
            LOG = require('./log/logger').getLog('FSConnectionProfileStore');
        }
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
                        LOG.info('load','Loaded connection profile ' + connectionProfile, contents);
                        resolve(JSON.parse(contents));
                    } else {
                        LOG.error('load','Failed to loaded connection profile ' + connectionProfile, err);
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
                                LOG.error('save','Failed to create dir for connection profile ' + connectionProfile, err);
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
                                    LOG.info('save','Saved connection profile ' + connectionProfile, contents);
                                    resolve();
                                } else {
                                    LOG.error('save','Failed to save connection profile ' + connectionProfile, err);
                                    reject(new Error('Failed to save connection profile ' + connectionProfile));
                                }
                            });
                    });
            });
    }
}

module.exports = FSConnectionProfileStore;
