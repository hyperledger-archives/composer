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

const DataService = require('composer-runtime').DataService;
const NodeDataCollection = require('./nodedatacollection');
const NodeUtils = require('./nodeutils');
const Logger = require('composer-common').Logger;
const LOG = Logger.getLog('NodeDataService');

const collectionObjectType = '$syscollections';

class NodeDataService extends DataService {

    /**
     * Creates an instance of NodeDataService.
     * @param {any} stub Chaincode stub for this invocation
     */
    constructor(stub) {
        super();
        const method = 'constructor';
        LOG.entry(method);
        this.stub = stub;
        LOG.exit(method);
    }

    toString() {
        return 'DataService';
    }

    /**
     * Create a collection with the specified ID.
     * @param {string} id The ID of the collection.
     * @param {force} [force] force creation, don't check for existence first.
     * @return {Promise} A promise that will be resolved with a {@link DataCollection}
     * when complete, or rejected with an error.
     */
    async createCollection(id, force) {
        const method = 'createCollection';
        LOG.entry(method, id, force);

        let key = this.stub.createCompositeKey(collectionObjectType, [id]);
        if (!force) {
            let value = await this.stub.getState(key);
            if (value.length === 0) {
                let result = await this._storeCollection(key, id);
                LOG.exit(method, result);
                return result;
            }
            else {
                throw new Error(`Failed to create collection with ID ${id} as it already exists`);
            }
        } else {
            let result = await this._storeCollection(key, id);
            LOG.exit(method, result);
            return result;
        }
    }

    /**
     * Store the collection in the world state.
     *
     * @param {any} key the world state key to use
     * @param {any} id the id of the collection
     * @return {Promise} A promise that will be resolved with a {@link DataCollection}
     * when complete, or rejected with an error.
     */
    async _storeCollection(key, id) {
        const method = '_storeCollection';
        LOG.entry(method, key, id);
        await this.stub.putState(key, Buffer.from(JSON.stringify({'id': id})));
        let retVal = new NodeDataCollection(this, this.stub, id);
        LOG.exit(method, retVal);
        return retVal;
    }

    /**
     * Delete a collection with the specified ID.
     * @param {string} id The ID of the collection.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    async deleteCollection(id) {
        const method = 'deleteCollection';
        LOG.entry(method, id);
        let key = this.stub.createCompositeKey(collectionObjectType, [id]);
        let exists = await this.existsCollection(id);
        if (!exists) {
            throw new Error(`Collection with ID ${id} does not exist`);
        }
        await this.clearCollection(id);
        await this.stub.deleteState(key);
        LOG.exit(method);
    }

   /**
    * Get the collection with the specified ID.
    * @param {string} id The ID of the collection.
    * @return {Promise} A promise that will be resolved with a {@link DataCollection}
    * when complete, or rejected with an error.
    */
    async getCollection(id) {
        const method = 'getCollection';
        LOG.entry(method, id);
        let key = this.stub.createCompositeKey(collectionObjectType, [id]);
        let value = await this.stub.getState(key);
        if (value.length === 0) {
            throw new Error(`Collection with ID ${id} does not exist`);
        }
        let retVal = new NodeDataCollection(this, this.stub, id);
        LOG.exit(method, retVal);
        return retVal;
    }

   /**
    * Determine whether the collection with the specified ID exists.
    * @param {string} id The ID of the collection.
    * @return {Promise} A promise that will be resolved with a boolean
    * indicating whether the collection exists.
    */
    async existsCollection(id) {
        const method = 'existsCollection';
        LOG.entry(method, id);
        let key = this.stub.createCompositeKey(collectionObjectType, [id]);
        let value = await this.stub.getState(key);
        let retVal = value.length !== 0;
        LOG.exit(method, retVal);
        return retVal;
    }

    /**
     * Execute a query across all objects stored in all collections, using a query
     * string that is dependent on the current Blockchain platform.
     * @param {string} queryString The query string for the current Blockchain platform.
     * @return {Promise} A promise that will be resolved with an array of objects
     * when complete, or rejected with an error.
     */
    async executeQuery(query) {
        const method = 'executeQuery';
        LOG.entry(method, query);
        let iterator = await this.stub.getQueryResult(query);
        let results = await NodeUtils.getAllResults(iterator);
        LOG.exit(method, results);
        return results;
    }

    /**
     * Remove all objects from the specified collection.
     * @param {string} id The ID of the collection.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    async clearCollection(id) {
        const method = 'clearCollection';
        LOG.entry(method, id);

        let iterator = await this.stub.getStateByPartialCompositeKey(id, []);
        await NodeUtils.deleteAllResults(iterator, this.stub);
        LOG.exit(method);
    }
}

module.exports = NodeDataService;
