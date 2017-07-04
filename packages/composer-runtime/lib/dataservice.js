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

const Logger = require('composer-common').Logger;
const Service = require('./service');

const LOG = Logger.getLog('DataService');

/**
 * Base class representing the data service provided by a {@link Container}.
 * @protected
 * @abstract
 * @memberof module:composer-runtime
 */
class DataService extends Service {

    /**
     * Create a collection with the specified ID.
     * @abstract
     * @param {string} id The ID of the collection.
     * @param {boolean} force Whether to force creation without checking it already exists.
     * @return {Promise} A promise that will be resolved with a {@link DataCollection}
     * when complete, or rejected with an error.
     */
    createCollection(id, force) {
        force = !!force;
        return new Promise((resolve, reject) => {
            this._createCollection(id, force, (error, dataCollection) => {
                if (error) {
                    return reject(error);
                }
                return resolve(dataCollection);
            });
        });
    }

    /**
     * @callback createCollectionCallback
     * @protected
     * @param {Error} error The error if any.
     * @param {DataCollection} dataCollection The data collection.
     */

    /**
     * Create a collection with the specified ID.
     * @abstract
     * @private
     * @param {string} id The ID of the collection.
     * @param {force} force force creation, don't check for existence 1st
     * @param {createCollectionCallback} callback The callback function to call when complete.
     */
    _createCollection(id, force, callback) {
        throw new Error('abstract function called');
    }

    /**
     * Delete a collection with the specified ID.
     * @abstract
     * @param {string} id The ID of the collection.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    deleteCollection(id) {
        return new Promise((resolve, reject) => {
            this._deleteCollection(id, (error) => {
                if (error) {
                    return reject(error);
                }
                return resolve();
            });
        });
    }

    /**
     * @callback deleteCollectionCallback
     * @protected
     * @param {Error} error The error if any.
     */

    /**
     * Delete a collection with the specified ID.
     * @abstract
     * @private
     * @param {string} id The ID of the collection.
     * @param {deleteCollectionCallback} callback The callback function to call when complete.
     */
    _deleteCollection(id, callback) {
        throw new Error('abstract function called');
    }

   /**
    * Get the collection with the specified ID.
    * @abstract
    * @param {string} id The ID of the collection.
    * @return {Promise} A promise that will be resolved with a {@link DataCollection}
    * when complete, or rejected with an error.
    */
    getCollection(id) {
        return new Promise((resolve, reject) => {
            this._getCollection(id, (error, dataCollection) => {
                if (error) {
                    return reject(error);
                }
                return resolve(dataCollection);
            });
        });
    }

    /**
     * @callback getCollectionCallback
     * @protected
     * @param {Error} error The error if any.
     * @param {DataCollection} dataCollection The data collection.
     */

    /**
     * Get the collection with the specified ID.
     * @abstract
     * @private
     * @param {string} id The ID of the collection.
     * @param {getCollectionCallback} callback The callback function to call when complete.
     */
    _getCollection(id, callback) {
        throw new Error('abstract function called');
    }

    /**
     * Determine whether the collection with the specified ID exists.
     * @abstract
     * @param {string} id The ID of the collection.
     * @return {Promise} A promise that will be resolved with a boolean
     * indicating whether the collection exists.
     */
    existsCollection(id) {
        return new Promise((resolve, reject) => {
            this._existsCollection(id, (error, exists) => {
                if (error) {
                    return reject(error);
                }
                return resolve(exists);
            });
        });
    }

    /**
     * @callback existsCollectionCallback
     * @protected
     * @param {Error} error The error if any.
     * @param {DataCollection} dataCollection The data collection.
     */

    /**
     * Determine whether the collection with the specified ID exists.
     * @abstract
     * @private
     * @param {string} id The ID of the collection.
     * @param {existsCollectionCallback} callback The callback function to call when complete.
     */
    _existsCollection(id, callback) {
        throw new Error('abstract function called');
    }

    /**
     * Execute a query across all objects stored in all collections, using a query
     * string that is dependent on the current Blockchain platform.
     * @abstract
     * @param {string} queryString The query string for the current Blockchain platform.
     * @return {Promise} A promise that will be resolved with an array of objects
     * when complete, or rejected with an error.
     */
    executeQuery(queryString) {
        return new Promise((resolve, reject) => {
            this._executeQuery(queryString, (error, result) => {
                if (error) {
                    return reject(error);
                }
                return resolve(result);
            });
        });
    }

    /**
     * @callback executeQueryCallback
     * @protected
     * @param {Error} error The error if any.
     * @param {Object[]} objects The objects.
     */

    /**
     * Execute a query across all objects stored in all collections, using a query
     * string that is dependent on the current Blockchain platform.
     * @abstract
     * @param {string} queryString The query string for the current Blockchain platform.
     * @param {executeQueryCallback} callback The callback function to call when complete.
     */
    _executeQuery(queryString, callback) {
        throw new Error('abstract function called');
    }

    /**
     * Check to see if the collection with the specified ID exists, and if not create it.
     * @param {string} id The ID of the collection.
     * @return {Promise} A promise that will be resolved with a {@link DataCollection}
     * when complete, or rejected with an error.
     */
    ensureCollection(id) {
        const method = 'ensureCollection';
        LOG.entry(method, id);
        return this.getCollection(id)
            .catch((error) => {
                LOG.debug(method, 'The collection does not exist, creating');
                return this.createCollection(id);
            })
            .then((collection) => {
                LOG.exit(method, collection);
                return collection;
            });
    }

}

module.exports = DataService;
