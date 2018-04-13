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

/**
 * Base class representing a data collection provided by a {@link DataService}.
 * @protected
 * @abstract
 * @memberof module:composer-runtime
 */
class DataCollection {

    /**
     * Constructor.
     * @param {DataService} dataService The owning data service.
     */
    constructor(dataService) {
        this.dataService = dataService;
    }

    /**
     * Get all of the objects in this collection.
     * @abstract
     * @return {Promise} A promise that will be resolved with an array of objects,
     * or rejected with an error.
     */
    async getAll() {
        throw new Error('abstract function called');
    }

    /**
     * Get the specified object in this collection.
     * @abstract
     * @param {string} id The ID of the object.
     * @return {Promise} A promise that will be resolved with an object, or rejected
     * with an error.
     */
    async get(id) {
        throw new Error('abstract function called');
    }

    /**
     * Check to see if the specified object exists in this collection.
     * @abstract
     * @param {string} id The ID of the object.
     * @return {Promise} A promise that will be resolved with an boolean which will
     * be true if the specified object exists in this collection, or rejected with
     * an error.
     */
    async exists(id) {
        throw new Error('abstract function called');
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
        throw new Error('abstract function called');
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
        throw new Error('abstract function called');
    }

    /**
     * Remove an object from the collection.
     * @abstract
     * @param {string} id The ID of the object.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    async remove(id) {
        throw new Error('abstract function called');
    }

}

module.exports = DataCollection;
