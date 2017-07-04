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
    getAll() {
        return new Promise((resolve, reject) => {
            this._getAll((error, result) => {
                if (error) {
                    return reject(error);
                }
                return resolve(result);
            });
        });
    }

    /**
     * @callback getAllCallback
     * @protected
     * @param {Error} error The error if any.
     * @param {Object[]} objects The objects in the collection.
     */

    /**
     * Get all of the objects in this collection.
     * @abstract
     * @private
     * @param {getAllCallback} callback The callback function to call when complete.
     */
    _getAll(callback) {
        throw new Error('abstract function called');
    }

    /**
     * Get the specified object in this collection.
     * @abstract
     * @param {string} id The ID of the object.
     * @return {Promise} A promise that will be resolved with an object, or rejected
     * with an error.
     */
    get(id) {
        return new Promise((resolve, reject) => {
            this._get(id, (error, result) => {
                if (error) {
                    return reject(error);
                }
                return resolve(result);
            });
        });
    }

    /**
     * @callback getCallback
     * @protected
     * @param {Error} error The error if any.
     * @param {Object} object The object in the collection.
     */

    /**
     * Get the specified object in this collection.
     * @abstract
     * @private
     * @param {string} id The ID of the object.
     * @param {getCallback} callback The callback function to call when complete.
     */
    _get(id, callback) {
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
    exists(id) {
        return new Promise((resolve, reject) => {
            this._exists(id, (error, result) => {
                if (error) {
                    return reject(error);
                }
                return resolve(result);
            });
        });
    }

    /**
     * @callback existsCallback
     * @protected
     * @param {Error} error The error if any.
     * @param {boolean} exists Whether or not the object exists in the collection.
     */

    /**
     * Check to see if the specified object exists in this collection.
     * @abstract
     * @private
     * @param {string} id The ID of the object.
     * @param {existsCallback} callback The callback function to call when complete.
     */
    _exists(id, callback) {
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
    add(id, object, force) {
        force = !!force;
        return new Promise((resolve, reject) => {
            this._add(id, object, force, (error, result) => {
                if (error) {
                    return reject(error);
                }
                return resolve();
            });
        });
    }

    /**
     * @callback addCallback
     * @protected
     * @param {Error} error The error if any.
     */

    /**
     * Add an object to the collection.
     * @abstract
     * @private
     * @param {string} id The ID of the object.
     * @param {Object} object The object.
     * @param {boolean} force don't check for existence, force it
     * @param {addCallback} callback The callback function to call when complete.
     */
    _add(id, object, force, callback) {
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
    update(id, object) {
        return new Promise((resolve, reject) => {
            this._update(id, object, (error, result) => {
                if (error) {
                    return reject(error);
                }
                return resolve();
            });
        });
    }

    /**
     * @callback updateCallback
     * @protected
     * @param {Error} error The error if any.
     */

    /**
     * Update an object in the collection.
     * @abstract
     * @private
     * @param {string} id The ID of the object.
     * @param {Object} object The object.
     * @param {updateCallback} callback The callback function to call when complete.
     */
    _update(id, object, callback) {
        throw new Error('abstract function called');
    }

    /**
     * Remove an object from the collection.
     * @abstract
     * @param {string} id The ID of the object.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    remove(id) {
        return new Promise((resolve, reject) => {
            this._remove(id, (error) => {
                if (error) {
                    return reject(error);
                }
                return resolve();
            });
        });
    }

    /**
     * @callback removeCallback
     * @protected
     * @param {Error} error The error if any.
     */

    /**
     * Remove an object from the collection.
     * @abstract
     * @private
     * @param {string} id The ID of the object.
     * @param {removeCallback} callback The callback function to call when complete.
     */
    _remove(id, callback) {
        throw new Error('abstract function called');
    }

}

module.exports = DataCollection;
