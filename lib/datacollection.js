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

/**
 * Base class representing a data collection provided by a {@link DataService}.
 * @protected
 * @abstract
 * @memberof module:ibm-concerto-runtime
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
     * Add an object to the collection.
     * @abstract
     * @param {string} id The ID of the object.
     * @param {Object} object The object.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    add(id, object) {
        return new Promise((resolve, reject) => {
            this._add(id, object, (error, result) => {
                if (error) {
                    return reject(error);
                }
                return resolve();
            });
        });
    }

    /**
     * @callback addCallback
     * @param {Error} error The error if any.
     */

    /**
     * Add an object to the collection.
     * @abstract
     * @private
     * @param {string} id The ID of the object.
     * @param {Object} object The object.
     * @param {addCallback} callback The callback function to call when complete.
     */
    _add(id, object, callback) {
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

    /**
     * Stop serialization of this object.
     * @return {Object} An empty object.
     */
    toJSON() {
        return {};
    }

}

module.exports = DataCollection;
