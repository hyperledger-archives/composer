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

const DataCollection = require('composer-runtime').DataCollection;
const NodeUtils = require('./nodeutils');
const Logger = require('composer-common').Logger;
const LOG = Logger.getLog('NodeDataCollection');

/**
 * Class representing a data collection provided by a {@link DataService}.
 */
class NodeDataCollection extends DataCollection {

    /**
     * Creates an instance of NodeDataCollection.
     * @param {DataService} dataService The owning data service.
     * @param {any} stub The stub for the current HLF invocation
     * @param {any} id The id of this collection
     */
    constructor(dataService, stub, id) {
        super(dataService);
        const method = 'constructor';
        LOG.entry(method, stub, id);
        this.stub = stub;
        this.collectionID = id;
        LOG.exit(method);
    }

    /**
     * Get all of the objects in this collection.
     * @return {Promise} A promise that will be resolved with an array of objects,
     * or rejected with an error.
     */
    async getAll() {
        const method = 'getAll';
        LOG.entry(method);
        const t0 = Date.now();

        let iterator = await this.stub.getStateByPartialCompositeKey(this.collectionID, []);
        let results = await NodeUtils.getAllResults(iterator);
        LOG.exit(method, results);
        LOG.debug('@PERF ' + method, 'Total (ms) duration: ' + (Date.now() - t0).toFixed(2));
        return results;
    }

    /**
     * Get the specified object in this collection.
     * @param {string} id The ID of the object.
     * @return {Promise} A promise that will be resolved with an object, or rejected
     * with an error.
     */
    async get(id) {
        const method = 'get';
        LOG.entry(method, id);
        const t0 = Date.now();

        let key = this.stub.createCompositeKey(this.collectionID, [id]);
        let value = await this.stub.getState(key);
        if (value.length === 0) {
            const newErr = new Error(`Object with ID '${id}' in collection with ID '${this.collectionID}' does not exist`);
            LOG.error(method, newErr);
            LOG.debug('@PERF ' + method, 'Total (ms) duration: ' + (Date.now() - t0).toFixed(2));
            throw newErr;
        }
        let retVal = JSON.parse(value.toString('utf8'));
        LOG.exit(method, retVal);
        LOG.debug('@PERF ' + method, 'Total (ms) duration: ' + (Date.now() - t0).toFixed(2));
        return retVal;
    }

    /**
     * Determine whether the specified object exists in this collection.
     * @param {string} id The ID of the object.
     * @return {Promise} A promise that will be resolved with a boolean indicating
     * whether the object exists.
     */
    async exists(id) {
        const method = 'exists';
        LOG.entry(method, id);
        const t0 = Date.now();

        let key = this.stub.createCompositeKey(this.collectionID, [id]);
        let value = await this.stub.getState(key);
        let retVal = value.length !== 0;
        LOG.exit(method, retVal);
        LOG.debug('@PERF ' + method, 'Total (ms) duration: ' + (Date.now() - t0).toFixed(2));
        return retVal;
    }

    /**
     * Add an object to the collection.
     * @abstract
     * @param {string} id The ID of the object.
     * @param {Object} object The object.
     * @param {boolean} force Whether to force creation without checking it already exists.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    async add(id, object, force) {
        const method = 'add';
        LOG.entry(method, id, object, force);
        const t0 = Date.now();

        let key = this.stub.createCompositeKey(this.collectionID, [id]);
        if (!force) {
            let value = await this.stub.getState(key);
            if (value.length !== 0) {
                const newErr =  new Error(`Failed to add object with ID '${id}' in collection with ID '${this.collectionID}' as the object already exists`);
                LOG.error(method, newErr);
                LOG.debug('@PERF ' + method, 'Total (ms) duration: ' + (Date.now() - t0).toFixed(2));
                throw newErr;
            }
        }
        await this.stub.putState(key, Buffer.from(JSON.stringify(object)));

        LOG.exit(method);
        LOG.debug('@PERF ' + method, 'Total (ms) duration: ' + (Date.now() - t0).toFixed(2));
    }

    /**
     * Add an object to the collection.
     * @abstract
     * @param {string} id The ID of the object.
     * @param {Object} object The object.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    async update(id, object) {
        const method = 'update';
        LOG.entry(method, id, object);
        const t0 = Date.now();

        let key = this.stub.createCompositeKey(this.collectionID, [id]);
        let value = await this.stub.getState(key);
        if (value.length === 0) {
            const newErr = new Error(`Failed to update object with ID '${id}' in collection with ID '${this.collectionID}' as the object does not exist`);
            LOG.error(method, newErr);
            LOG.debug('@PERF ' + method, 'Total (ms) duration: ' + (Date.now() - t0).toFixed(2));
            throw newErr;
        }
        await this.stub.putState(key, Buffer.from(JSON.stringify(object)));
        LOG.exit(method);
        LOG.debug('@PERF ' + method, 'Total (ms) duration: ' + (Date.now() - t0).toFixed(2));
    }

    /**
     * Remove an object from the collection.
     * @param {string} id The ID of the object.
     */
    async remove(id) {
        const method = 'remove';
        LOG.exit(method, id);
        const t0 = Date.now();

        let key = this.stub.createCompositeKey(this.collectionID, [id]);
        let value = await this.stub.getState(key);
        if (value.length === 0) {
            const newErr = new Error(`Failed to delete object with ID '${id}' in collection with ID '${this.collectionID}' as the object does not exist`);
            LOG.error(method, newErr);
            LOG.debug('@PERF ' + method, 'Total (ms) duration: ' + (Date.now() - t0).toFixed(2));
            throw newErr;
        }
        await this.stub.deleteState(key);
        LOG.exit(method);
        LOG.debug('@PERF ' + method, 'Total (ms) duration: ' + (Date.now() - t0).toFixed(2));
    }
}

module.exports = NodeDataCollection;
