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
 * Base class representing the data service provided by a {@link Container}.
 * @protected
 * @abstract
 * @memberof module:ibm-concerto-runtime
 */
class DataService {

    /**
     * Create a collection with the specified ID.
     * @abstract
     * @param {string} id The ID of the collection.
     * @return {Promise} A promise that will be resolved with a {@link DataCollection}
     * when complete, or rejected with an error.
     */
    createCollection(id) {
        return new Promise((resolve, reject) => {
            this._createCollection(id, (error, dataCollection) => {
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
     * @param {createCollectionCallback} callback The callback function to call when complete.
     */
    _createCollection(id, callback) {
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
     * Determine whether the collection with the specified ID exists.
     * @abstract
     * @param {string} id The ID of the collection.
     * @return {Promise} A promise that will be resolved with a boolean
     * indicating whether the collection exists.
     */
    existsCollection(id) {
        return new Promise((resolve, reject) => {
            this._existsCollection(id, (error, dataCollection) => {
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
     * @callback getCollectionCallback
     * @protected
     * @param {Error} error The error if any.
     * @param {DataCollection} dataCollection The data collection.
     */

    /**
     * Determine whether the collection with the specified ID exists.
     * @abstract
     * @private
     * @param {string} id The ID of the collection.
     * @param {getCollectionCallback} callback The callback function to call when complete.
     */
    _existsCollection(id, callback) {
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

module.exports = DataService;
