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
 * Manages persistence of connection profiles in the environment.
 *
 * @private
 * @abstract
 * @class
 * @memberof module:composer-common
 */
class EnvConnectionProfileStore extends ConnectionProfileStore {

    /**
     * Constructor.
     */
    constructor() {
        super();
        const method = 'constructor';
        LOG.entry(method);
        if (process.env.COMPOSER_CONFIG) {
            try {
                this.env = JSON.parse(process.env.COMPOSER_CONFIG);
            } catch (e) {
                LOG.error(method, 'Failed to parse the value of the COMPOSER_CONFIG environment variable', e);
                throw new Error('Failed to parse the value of the COMPOSER_CONFIG environment variable');
            }
        } else {
            this.env = {};
        }
        this.env.connectionProfiles = this.env.connectionProfiles || {};
        LOG.debug(method, 'Loaded environment', this.env);
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
        return Promise.resolve()
            .then(() => {
                const connectionProfileData = this.env.connectionProfiles[connectionProfile];
                if (!connectionProfileData) {
                    throw new Error(`The connection profile ${connectionProfile} does not exist in the environment`);
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
        const e = new Error(`Cannot save connection profile ${connectionProfile} into the environment`);
        LOG.error(method, e);
        return Promise.reject(e);
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
        return Promise.resolve()
            .then(() => {
                const connectionProfiles = Object.keys(this.env.connectionProfiles).sort();
                const result = {};
                connectionProfiles.forEach((connectionProfile) => {
                    const connectionProfileData = this.env.connectionProfiles[connectionProfile];
                    result[connectionProfile] = connectionProfileData;
                });
                LOG.exit(method, result);
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
        const method = 'delete';
        LOG.entry(method, connectionProfile);
        const e = new Error(`Cannot delete connection profile ${connectionProfile} from the environment`);
        LOG.error(method, e);
        return Promise.reject(e);
    }

}

module.exports = EnvConnectionProfileStore;
