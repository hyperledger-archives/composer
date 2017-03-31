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
const Logger = require('./log/logger');

const LOG = Logger.getLog('EnvConnectionProfileStore');

/**
 * Manages persistence of connection profiles across multiple
 * connection profile stores.
 *
 * @private
 * @abstract
 * @class
 * @memberof module:composer-common
 */
class ComboConnectionProfileStore extends ConnectionProfileStore {

    /**
     * Constructor.
     */
    constructor() {
        super();
        const method = 'constructor';
        const args = Array.prototype.slice.call(arguments);
        LOG.entry(method, arguments);
        this.connectionProfileStores = args.map((arg) => {
            if (arg instanceof ConnectionProfileStore) {
                return arg;
            }
            throw new Error('Specified argument is not a connection profile store instance');
        });
        LOG.exit(method);
    }

    /**
     * Loads connectOptions for a given connection profile.
     *
     * @param {string} connectionProfile The name of the connection profile to load
     * @return {Promise} A promise that is resolved with a JS Object for the
     * data in the connection profile.
     */
    load(connectionProfile) {
        const method = 'load';
        LOG.entry(method, connectionProfile);
        return this.connectionProfileStores
            .reduce((result, connectionProfileStore) => {
                return result.then((connectionProfileData) => {
                    LOG.debug(method, 'Looking at connection profile store', connectionProfileStore);
                    if (connectionProfileData) {
                        LOG.debug(method, 'Connection profile already loaded, skipping');
                        return connectionProfileData;
                    }
                    LOG.debug(method, 'Connection profile not loaded, loading');
                    return connectionProfileStore.load(connectionProfile)
                        .catch((error) =>{
                            LOG.debug(method, 'Caught error, ignoring', error);
                            return null;
                        });
                });
            }, Promise.resolve(null))
            .then((connectionProfileData) => {
                if (!connectionProfileData) {
                    throw new Error(`The connection profile ${connectionProfile} does not exist`);
                }
                LOG.exit(method, connectionProfileData);
                return connectionProfileData;
            })
            .catch((e) => {
                LOG.error(method, e);
                throw e;
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
        const method = 'save';
        LOG.entry(method, connectionProfile, connectOptions);
        return this.connectionProfileStores
            .reduce((result, connectionProfileStore) => {
                return result.then((saved) => {
                    LOG.debug(method, 'Looking at connection profile store', connectionProfileStore);
                    if (saved) {
                        LOG.debug(method, 'Connection profile already saved, skipping');
                        return true;
                    }
                    LOG.debug(method, 'Connection profile not saved, saving');
                    return connectionProfileStore.save(connectionProfile, connectOptions)
                        .then(() => {
                            LOG.debug(method, 'Saved');
                            return true;
                        })
                        .catch((error) =>{
                            LOG.debug(method, 'Caught error, ignoring', error);
                            return false;
                        });
                });
            }, Promise.resolve(false))
            .then((saved) => {
                if (!saved) {
                    throw new Error(`The connection profile ${connectionProfile} could not be saved`);
                }
                LOG.exit(method);
            })
            .catch((e) => {
                LOG.error(method, e);
                throw e;
            });
    }

    /**
     * Loads all of the connection profiles.
     *
     * @return {Promise} A promise that is resolved with a JS Object where the
     * keys are the connection profiles, and the values are the connection options.
     */
    loadAll() {
        const method = 'loadAll';
        LOG.entry(method);
        return this.connectionProfileStores
            .reduce((result, connectionProfileStore) => {
                return result.then((connectionProfiles) => {
                    LOG.debug(method, 'Looking at connection profile store', connectionProfileStore);
                    return connectionProfileStore.loadAll()
                        .then((thisConnectionProfiles) => {
                            return Object.assign(thisConnectionProfiles, connectionProfiles);
                        });
                });
            }, Promise.resolve({}))
            .then((connectionProfiles) => {
                LOG.exit(method, connectionProfiles);
                return connectionProfiles;
            })
            .catch((e) => {
                LOG.error(method, e);
                throw e;
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
        const method = 'delete';
        LOG.entry(method, connectionProfile);
        return this.connectionProfileStores
            .reduce((result, connectionProfileStore) => {
                return result.then(() => {
                    LOG.debug(method, 'Looking at connection profile store', connectionProfileStore);
                    // We don't skip if already deleted as we likely want to delete it from everywhere.
                    LOG.debug(method, 'Deleting connection profile');
                    return connectionProfileStore.delete(connectionProfile)
                        .then(() => {
                            LOG.debug(method, 'Deleted');
                        })
                        .catch((error) =>{
                            LOG.debug(method, 'Caught error, ignoring', error);
                        });
                });
            }, Promise.resolve())
            .then(() => {
                LOG.exit(method);
            });
    }

}

module.exports = ComboConnectionProfileStore;
