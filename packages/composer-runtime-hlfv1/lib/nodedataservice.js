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

/**
 * Class representing a data service provided by a {@link Container}.
 */
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
        const t0 = Date.now();

        let key = this.stub.createCompositeKey(collectionObjectType, [id]);
        if (!force) {
            let value = await this.stub.getState(key);
            if (value.length === 0) {
                let result = await this._storeCollection(key, id);
                LOG.exit(method, result);
                LOG.debug('@PERF ' + method, 'Total (ms) duration: ' + (Date.now() - t0).toFixed(2));
                return result;
            }
            else {
                LOG.debug('@PERF ' + method, 'Total (ms) duration: ' + (Date.now() - t0).toFixed(2));
                throw new Error(`Failed to create collection with ID ${id} as it already exists`);
            }
        } else {
            let result = await this._storeCollection(key, id);
            LOG.exit(method, result);
            LOG.debug('@PERF ' + method, 'Total (ms) duration: ' + (Date.now() - t0).toFixed(2));
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
        const t0 = Date.now();

        await this.stub.putState(key, Buffer.from(JSON.stringify({'id': id})));
        let retVal = new NodeDataCollection(this, this.stub, id);
        LOG.exit(method, retVal);
        LOG.debug('@PERF ' + method, 'Total (ms) duration: ' + (Date.now() - t0).toFixed(2));
        return retVal;
    }

    /**
     * Delete a collection with the specified ID.
     * @param {string} id The ID of the collection.
     */
    async deleteCollection(id) {
        const method = 'deleteCollection';
        LOG.entry(method, id);
        const t0 = Date.now();

        let key = this.stub.createCompositeKey(collectionObjectType, [id]);
        let exists = await this.existsCollection(id);
        if (!exists) {
            LOG.debug('@PERF ' + method, 'Total (ms) duration: ' + (Date.now() - t0).toFixed(2));
            throw new Error(`Collection with ID ${id} does not exist`);
        }
        await this.clearCollection(id);
        await this.stub.deleteState(key);
        LOG.exit(method);
        LOG.debug('@PERF ' + method, 'Total (ms) duration: ' + (Date.now() - t0).toFixed(2));
    }

   /**
    * Get the collection with the specified ID.
    * @param {string} id The ID of the collection.
    * @param {Boolean} bypass bypass existence check
    * @return {Promise} A promise that will be resolved with a {@link DataCollection}
    * when complete, or rejected with an error.
    */
    async getCollection(id, bypass) {
        const method = 'getCollection';
        LOG.entry(method, id);
        const t0 = Date.now();

        if (bypass) {
            let retVal = new NodeDataCollection(this, this.stub, id);
            LOG.exit(method, retVal);
            LOG.debug('@PERF ' + method, 'Total (ms) duration: ' + (Date.now() - t0).toFixed(2));
            return retVal;
        } else {
            let key = this.stub.createCompositeKey(collectionObjectType, [id]);
            let value = await this.stub.getState(key);
            if (value.length === 0) {
                LOG.debug('@PERF ' + method, 'Total (ms) duration: ' + (Date.now() - t0).toFixed(2));
                throw new Error(`Collection with ID ${id} does not exist`);
            }
            let retVal = new NodeDataCollection(this, this.stub, id);
            LOG.exit(method, retVal);
            LOG.debug('@PERF ' + method, 'Total (ms) duration: ' + (Date.now() - t0).toFixed(2));
            return retVal;
        }
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
        const t0 = Date.now();

        let key = this.stub.createCompositeKey(collectionObjectType, [id]);
        let value = await this.stub.getState(key);
        let retVal = value.length !== 0;
        LOG.exit(method, retVal);
        LOG.debug('@PERF ' + method, 'Total (ms) duration: ' + (Date.now() - t0).toFixed(2));
        return retVal;
    }

    /**
     * Execute a query across all objects stored in all collections, using a query
     * string that is dependent on the current Blockchain platform.
     * @param {string} query The query string for the current Blockchain platform.
     * @return {Promise} A promise that will be resolved with an array of objects
     * when complete, or rejected with an error.
     */
    async executeQuery(query) {
        const method = 'executeQuery';
        LOG.entry(method, query);
        const t0 = Date.now();

        let iterator = await this.stub.getQueryResult(query);
        let results = await NodeUtils.getAllResults(iterator);
        LOG.exit(method, results);
        LOG.debug('@PERF ' + method, 'Total (ms) duration: ' + (Date.now() - t0).toFixed(2));
        return results;
    }

    /**
     * Remove all objects from the specified collection.
     * @param {string} id The ID of the collection.
     */
    async clearCollection(id) {
        const method = 'clearCollection';
        LOG.entry(method, id);
        const t0 = Date.now();

        let iterator = await this.stub.getStateByPartialCompositeKey(id, []);
        await NodeUtils.deleteAllResults(iterator, this.stub);
        LOG.exit(method);
        LOG.debug('@PERF ' + method, 'Total (ms) duration: ' + (Date.now() - t0).toFixed(2));
    }
}

module.exports = NodeDataService;
