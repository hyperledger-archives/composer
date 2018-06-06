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
    async createCollection(id, force) {
        throw new Error('abstract function called');
    }

    /**
     * Delete a collection with the specified ID.
     * @abstract
     * @param {string} id The ID of the collection.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    async deleteCollection(id) {
        throw new Error('abstract function called');
    }

   /**
    * Get the collection with the specified ID.
    * @abstract
    * @param {string} id The ID of the collection.
    * @param {Boolean} bypass bypass existence check
    * @return {Promise} A promise that will be resolved with a {@link DataCollection}
    * when complete, or rejected with an error.
    */
    async getCollection(id, bypass) {
        throw new Error('abstract function called');
    }

    /**
     * Determine whether the collection with the specified ID exists.
     * @abstract
     * @param {string} id The ID of the collection.
     * @return {Promise} A promise that will be resolved with a boolean
     * indicating whether the collection exists.
     */
    async existsCollection(id) {
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
    async executeQuery(queryString) {
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
